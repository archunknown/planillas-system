import { SistemaPensionario, RegimenLaboral } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
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
