import { SistemaPensionario, RegimenLaboral, type Liquidacion } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/client';
import {
  calcularPlanilla,
  type RegimenType,
  type DatosPeriodoInput,
  type ResultadoPlanilla,
} from '../calculations';
import { getParametroVigente, getAfpTasas } from './parametros.service';

function regimenLaboralToRegimenType(regimen: RegimenLaboral): RegimenType {
  const map: Record<RegimenLaboral, RegimenType> = {
    GENERAL: 'GENERAL',
    MYPE_MICRO: 'MYPE_MICRO',
    MYPE_PEQUENA: 'MYPE_PEQUENA',
    CONSTRUCCION_CIVIL: 'CONSTRUCCION_CIVIL',
    AGRARIO: 'AGRARIO',
  };
  return map[regimen];
}

function sistemaPensionarioToAfpNombre(sistema: SistemaPensionario): string | null {
  const map: Partial<Record<SistemaPensionario, string>> = {
    AFP_HABITAT: 'HABITAT',
    AFP_INTEGRA: 'INTEGRA',
    AFP_PRIMA: 'PRIMA',
    AFP_PROFUTURO: 'PROFUTURO',
  };
  return map[sistema] ?? null;
}

function toDecimal(value: number): Decimal {
  return new Decimal(value);
}

function getUltimoDiaMes(mes: number, anio: number): Date {
  return new Date(Date.UTC(anio, mes, 0)); // día 0 del mes siguiente = último día del mes actual
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function diasEntre(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function inicioSemestreCTS(d: Date): Date {
  const m = d.getUTCMonth(), y = d.getUTCFullYear();
  // May-Oct (4-9): semestre May 1; Nov-Dec (10-11): semestre Nov 1; Jan-Apr (0-3): semestre Nov 1 prev year
  return m >= 4 && m <= 9
    ? new Date(Date.UTC(y, 4, 1))
    : m >= 10
      ? new Date(Date.UTC(y, 10, 1))
      : new Date(Date.UTC(y - 1, 10, 1));
}

function inicioSemestreGratif(d: Date): Date {
  const m = d.getUTCMonth(), y = d.getUTCFullYear();
  return m < 6 ? new Date(Date.UTC(y, 0, 1)) : new Date(Date.UTC(y, 6, 1));
}

export async function calcularPlanillaPeriodo(
  empresaId: string,
  mes: number,
  anio: number
): Promise<void> {
  const fechaPeriodo = new Date(Date.UTC(anio, mes - 1, 1));
  const ultimoDia = getUltimoDiaMes(mes, anio);

  // a) Buscar o crear el Periodo
  const periodo = await prisma.periodo.upsert({
    where: { mes_anio: { mes, anio } },
    create: { mes, anio },
    update: {},
  });

  // b) Contratos activos de la empresa
  const contratos = await prisma.contrato.findMany({
    where: {
      empresaId,
      activo: true,
      fechaInicio: { lte: ultimoDia },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: fechaPeriodo } },
      ],
    },
    include: {
      trabajador: { include: { hijos: true } },
    },
  });

  // c) Procesar cada contrato
  for (const contrato of contratos) {
    // Obtener o crear el detalle del periodo
    const detalleExistente = await prisma.planillaDetalle.findUnique({
      where: { periodoId_contratoId: { periodoId: periodo.id, contratoId: contrato.id } },
    });

    const detalle = detalleExistente ?? await prisma.planillaDetalle.create({
      data: {
        periodoId: periodo.id,
        contratoId: contrato.id,
        remuneracionBasica: toDecimal(0),
        totalIngresos: toDecimal(0),
        totalDescuentos: toDecimal(0),
        totalAportesEmpleador: toDecimal(0),
        netoPagar: toDecimal(0),
      },
    });

    // Parámetros vigentes
    const rmv = await getParametroVigente('RMV', fechaPeriodo);
    const uit = await getParametroVigente('UIT', fechaPeriodo);

    let afpTasas: { aporte: number; comision: number; primaSeguro: number } | null = null;
    const sistemaPension: 'ONP' | 'AFP' = contrato.sistemaPensionario === 'ONP' ? 'ONP' : 'AFP';

    if (sistemaPension === 'AFP') {
      const afpNombre = sistemaPensionarioToAfpNombre(contrato.sistemaPensionario);
      if (afpNombre) {
        afpTasas = await getAfpTasas(afpNombre, fechaPeriodo);
      }
    }

    const cantidadHijos = contrato.trabajador.hijos.length;
    const remuneracionBase = contrato.remuneracionBase.toNumber();
    const diasTrabajados = detalle.diasTrabajados;
    const horasExtras25 = detalle.horasExtras25.toNumber();
    const horasExtras35 = detalle.horasExtras35.toNumber();
    const horasExtras100 = detalle.horasExtras100.toNumber();

    const datos: DatosPeriodoInput = {
      remuneracionBase,
      diasTrabajados,
      horasExtras25,
      horasExtras35,
      horasExtras100,
      faltas: detalle.faltas,
      feriados: detalle.feriados,
      jornadaSemanal: contrato.jornadaSemanal,
      tieneAsignacionFamiliar: contrato.tieneAsignacionFamiliar,
      cantidadHijos,
      rmv,
      uit,
      sistemaPensionario: sistemaPension,
      afpTasas,
      // Proyección simple: se usa la remuneración base mensual del contrato
      remuneracionMensualProyectada: remuneracionBase,
      // Gratificaciones proyectadas: 2 sueldos al año (julio y diciembre)
      gratificacionesAnualesProyectadas: remuneracionBase * 2,
      mesActual: mes,
      retencionesQuintaAnteriores: 0,
      tasaEssalud: await getParametroVigente('ESSALUD_GENERAL', fechaPeriodo),
      tasaSctr: 0,
    };

    const regimenType = regimenLaboralToRegimenType(contrato.regimenLaboral);

    let resultado: ResultadoPlanilla;

    if (regimenType === 'MYPE_MICRO') {
      const cuotaSis = await getParametroVigente('SIS_MYPE_MICRO_CUOTA', fechaPeriodo);
      const { calcularPlanillaMype } = await import('../calculations/regimenes/mype');
      resultado = calcularPlanillaMype(datos, true, cuotaSis);
    } else if (regimenType === 'AGRARIO') {
      const tasaEssaludAgrario = await getParametroVigente('ESSALUD_AGRARIO_MENOR', fechaPeriodo);
      const { calcularPlanillaAgrario } = await import('../calculations/regimenes/agrario');
      // remuneracionDiariaAgraria: sin datos adicionales, se usa remuneracionBase / 30 como aproximación
      resultado = calcularPlanillaAgrario(datos, datos.remuneracionBase / 30, tasaEssaludAgrario);
    } else if (regimenType === 'CONSTRUCCION_CIVIL') {
      const cat = contrato.categoriaCC;
      const jornalKey = cat === 'OPERARIO' ? 'JORNAL_CC_OPERARIO' : cat === 'OFICIAL' ? 'JORNAL_CC_OFICIAL' : 'JORNAL_CC_PEON';
      const bucKey    = cat === 'OPERARIO' ? 'BUC_CC_OPERARIO'    : cat === 'OFICIAL' ? 'BUC_CC_OFICIAL'    : 'BUC_CC_PEON';
      const [jornalDiario, porcentajeBuc, movilidadDiaria] = await Promise.all([
        getParametroVigente(jornalKey, fechaPeriodo),
        getParametroVigente(bucKey, fechaPeriodo),
        getParametroVigente('MOVILIDAD_CC_LABORABLE', fechaPeriodo),
      ]);
      resultado = calcularPlanilla({
        regimen: 'CONSTRUCCION_CIVIL',
        datos,
        datosConstruccionCivil: {
          jornalDiario,
          categoriaCC: cat as 'OPERARIO' | 'OFICIAL' | 'PEON',
          porcentajeBuc,
          movilidadDiaria,
          trabajaEnAltura: contrato.zonaBonificacion?.toUpperCase() === 'ALTURA',
        },
      });
    } else {
      resultado = calcularPlanilla({ regimen: regimenType, datos });
    }

    // Guardar resultado en el detalle
    await prisma.planillaDetalle.update({
      where: { id: detalle.id },
      data: {
        remuneracionBasica: toDecimal(resultado.ingresos.remuneracionBasica),
        horasExtrasTotal: toDecimal(resultado.ingresos.horasExtrasTotal),
        asignacionFamiliar: toDecimal(resultado.ingresos.asignacionFamiliar),
        bonificacionCC: toDecimal(resultado.ingresos.bonificacionCC),
        movilidadCC: toDecimal(resultado.ingresos.movilidadCC),
        bonificacionAltura: toDecimal(resultado.ingresos.bonificacionAltura),
        otrosIngresos: toDecimal(resultado.ingresos.otrosIngresos),
        totalIngresos: toDecimal(resultado.ingresos.totalIngresos),
        descuentoOnp: toDecimal(resultado.descuentos.descuentoOnp),
        descuentoAfp: toDecimal(resultado.descuentos.descuentoAfp),
        comisionAfp: toDecimal(resultado.descuentos.comisionAfp),
        primaSeguroAfp: toDecimal(resultado.descuentos.primaSeguroAfp),
        retencionQuinta: toDecimal(resultado.descuentos.retencionQuinta),
        otrosDescuentos: toDecimal(resultado.descuentos.otrosDescuentos),
        totalDescuentos: toDecimal(resultado.descuentos.totalDescuentos),
        essalud: toDecimal(resultado.aportesEmpleador.essalud),
        sctr: toDecimal(resultado.aportesEmpleador.sctr),
        totalAportesEmpleador: toDecimal(resultado.aportesEmpleador.totalAportesEmpleador),
        netoPagar: toDecimal(resultado.netoPagar),
      },
    });
  }

  // d) Marcar el periodo como CALCULADO
  await prisma.periodo.update({
    where: { id: periodo.id },
    data: { estado: 'CALCULADO' },
  });
}

/**
 * Calcula y persiste la liquidación de beneficios sociales al cese.
 * Base legal: D.S. 001-97-TR (TUO LCTS), Ley 27735, D.Leg. 713.
 * Los descuentos en liquidación requieren autorización expresa del trabajador
 * (D.S. 001-97-TR art. 45); por defecto se aplican en 0.
 * La remuneración pendiente debe ser registrada por el caller si existe.
 */
export async function calcularLiquidacionContrato(
  contratoId: string,
  fechaCese: Date,
): Promise<Liquidacion> {
  const contrato = await prisma.contrato.findUniqueOrThrow({
    where: { id: contratoId },
    include: { trabajador: { include: { hijos: true } } },
  });

  const rb = contrato.remuneracionBase.toNumber();
  const rmv = await getParametroVigente('RMV', fechaCese);
  const tasaEs = await getParametroVigente('ESSALUD_GENERAL', fechaCese);
  const af = contrato.tieneAsignacionFamiliar && contrato.trabajador.hijos.length > 0
    ? round2(rmv * 0.10) : 0;

  // CTS trunca — semestre CTS en curso
  const dcCTS = diasEntre(inicioSemestreCTS(fechaCese), fechaCese);
  const ctsMeses = Math.floor(dcCTS / 30);
  const ctsDias  = dcCTS % 30;
  const { calcularCts } = await import('../calculations/beneficios/cts');
  const ctsR = calcularCts({
    remuneracionBase: rb, asignacionFamiliar: af,
    promedioHorasExtras6Meses: 0, sextoGratificacion: 0,
    mesesComputablesCompletos: ctsMeses, diasComputablesRestantes: ctsDias,
  });

  // Gratificación trunca — semestre gratif en curso, solo base (Ley 30334 no aplica a trunca)
  const dcGrat = diasEntre(inicioSemestreGratif(fechaCese), fechaCese);
  const gratMeses = Math.floor(dcGrat / 30);
  const gratDias  = dcGrat % 30;
  const { calcularGratificacion } = await import('../calculations/beneficios/gratificaciones');
  const gratR = calcularGratificacion({
    remuneracionBase: rb, asignacionFamiliar: af,
    mesesComputables: gratMeses, diasComputables: gratDias, tasaEssalud: tasaEs,
  });

  // Vacaciones truncas — desde fechaInicio, módulo 12 meses completos
  const dcVac = diasEntre(contrato.fechaInicio, fechaCese);
  const vacMeses = Math.floor(dcVac / 30) % 12;
  const vacDias  = dcVac % 30;
  const { calcularVacacionesTruncas } = await import('../calculations/beneficios/vacaciones');
  const vacR = calcularVacacionesTruncas({
    remuneracionBase: rb, asignacionFamiliar: af,
    mesesComputables: vacMeses, diasComputables: vacDias,
  });

  const { calcularLiquidacion } = await import('../calculations/beneficios/liquidacion');
  const liq = calcularLiquidacion({
    ctsTrunca: ctsR.total,
    gratificacionTrunca: gratR.gratificacionBase,
    vacacionesTruncas: vacR.total,
    remuneracionPendiente: 0,
    descuentos: 0,
  });

  const result = await prisma.liquidacion.upsert({
    where: { contratoId },
    create: {
      contratoId, fechaCese,
      ctsTruncaMeses: ctsMeses, ctsTruncaDias: ctsDias, ctsTrunca: toDecimal(ctsR.total),
      vacacionesTruncaMeses: vacMeses, vacacionesTruncaDias: vacDias, vacacionesTruncas: toDecimal(vacR.total),
      gratificacionTruncaMeses: gratMeses, gratificacionTruncaDias: gratDias,
      gratificacionTrunca: toDecimal(gratR.gratificacionBase),
      totalBruto: toDecimal(liq.totalBruto), descuentos: toDecimal(0), totalNeto: toDecimal(liq.totalNeto),
    },
    update: {
      fechaCese,
      ctsTruncaMeses: ctsMeses, ctsTruncaDias: ctsDias, ctsTrunca: toDecimal(ctsR.total),
      vacacionesTruncaMeses: vacMeses, vacacionesTruncaDias: vacDias, vacacionesTruncas: toDecimal(vacR.total),
      gratificacionTruncaMeses: gratMeses, gratificacionTruncaDias: gratDias,
      gratificacionTrunca: toDecimal(gratR.gratificacionBase),
      totalBruto: toDecimal(liq.totalBruto), descuentos: toDecimal(0), totalNeto: toDecimal(liq.totalNeto),
    },
  });

  await prisma.contrato.update({ where: { id: contratoId }, data: { activo: false } });

  return result;
}
