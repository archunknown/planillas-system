// anular es operación terminal — no existe reactivar. Razón: auditabilidad.
// contratoId no tiene @unique: un contrato puede tener múltiples liquidaciones,
// pero solo una vigente (anulada=false) en un momento dado.
// La unicidad de la liquidación vigente se gestiona aquí, no en DB.
import { Prisma, type Liquidacion } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { getParametroVigente } from './parametros.service';
import {
  CalcularLiquidacionSchema,
  AnularLiquidacionSchema,
  ListarLiquidacionesSchema,
  type CalcularLiquidacionInput,
  type AnularLiquidacionInput,
  type ListarLiquidacionesInput,
} from '@/lib/validations/liquidacion';

export type { CalcularLiquidacionInput, AnularLiquidacionInput, ListarLiquidacionesInput };

// ── Utilidades puras (equivalentes a las de planilla.service.ts) ──────────────

function toDecimal(value: number): Decimal { return new Decimal(value); }
const round2 = (n: number): number => Math.round(n * 100) / 100;
function diasEntre(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
function inicioSemestreCTS(d: Date): Date {
  const m = d.getUTCMonth(), y = d.getUTCFullYear();
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

// ── calcular ─────────────────────────────────────────────────────────────────

export async function calcular(input: CalcularLiquidacionInput): Promise<Liquidacion> {
  const { contratoId, fechaCese, motivoCese } = CalcularLiquidacionSchema.parse(input);

  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: { trabajador: { include: { hijos: { where: { eliminadoEn: null } } } } },
  });
  if (!contrato) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${contratoId}.`, { contratoId });
  if (contrato.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'El contrato está eliminado.', { contratoId });
  }
  if (fechaCese < contrato.fechaInicio) {
    throw new ServiceError(
      'INVALID_STATE',
      'fechaCese no puede ser anterior a la fechaInicio del contrato.',
      { contratoId, fechaCese, fechaInicio: contrato.fechaInicio },
    );
  }

  // Verificar que no exista liquidación vigente (anulada=false) para este contrato
  const vigente = await prisma.liquidacion.findFirst({
    where: { contratoId, anulada: false },
  });
  if (vigente) {
    throw new ServiceError(
      'INVALID_STATE',
      'Ya existe una liquidación vigente para este contrato. Anúlala antes de recalcular.',
      { contratoId, liquidacionId: vigente.id },
    );
  }

  const rb = contrato.remuneracionBase.toNumber();
  const rmv = await getParametroVigente('RMV', fechaCese);
  const tasaEs = await getParametroVigente('ESSALUD_GENERAL', fechaCese);
  const af = contrato.tieneAsignacionFamiliar && contrato.trabajador.hijos.length > 0
    ? round2(rmv * 0.10) : 0;

  // Sexto de gratificación: proxy via PlanillaDetalle de julio/diciembre
  const gratifDetalles = await prisma.planillaDetalle.findMany({
    where: { contratoId, periodo: { mes: { in: [7, 12] } } },
    include: { periodo: { select: { mes: true, anio: true } } },
    orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { mes: 'desc' } }],
    take: 2,
  });
  const sextoGratificacion = gratifDetalles.length > 0
    ? round2(gratifDetalles.reduce((s, d) => s + d.remuneracionBasica.toNumber(), 0) / 6)
    : 0;

  // CTS trunca
  const dcCTS = diasEntre(inicioSemestreCTS(fechaCese), fechaCese);
  const ctsMeses = Math.floor(dcCTS / 30);
  const ctsDias  = dcCTS % 30;
  const { calcularCts } = await import('../calculations/beneficios/cts');
  const ctsR = calcularCts({
    remuneracionBase: rb, asignacionFamiliar: af,
    promedioHorasExtras6Meses: 0, sextoGratificacion,
    mesesComputablesCompletos: ctsMeses, diasComputablesRestantes: ctsDias,
  });

  // Gratificación trunca
  const dcGrat = diasEntre(inicioSemestreGratif(fechaCese), fechaCese);
  const gratMeses = Math.floor(dcGrat / 30);
  const gratDias  = dcGrat % 30;
  const { calcularGratificacion } = await import('../calculations/beneficios/gratificaciones');
  const gratR = calcularGratificacion({
    remuneracionBase: rb, asignacionFamiliar: af,
    mesesComputables: gratMeses, diasComputables: gratDias, tasaEssalud: tasaEs,
  });

  // Vacaciones truncas
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

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.liquidacion.create({
      data: {
        contratoId, fechaCese,
        ctsTruncaMeses: ctsMeses, ctsTruncaDias: ctsDias, ctsTrunca: toDecimal(ctsR.total),
        vacacionesTruncaMeses: vacMeses, vacacionesTruncaDias: vacDias, vacacionesTruncas: toDecimal(vacR.total),
        gratificacionTruncaMeses: gratMeses, gratificacionTruncaDias: gratDias,
        gratificacionTrunca: toDecimal(gratR.gratificacionBase),
        totalBruto: toDecimal(liq.totalBruto), descuentos: toDecimal(0), totalNeto: toDecimal(liq.totalNeto),
      },
    });
    await tx.contrato.update({
      where: { id: contratoId },
      data: { activo: false, fechaFin: fechaCese, motivoCese },
    });
    return record;
  });

  return result;
}

// ── Consultas ─────────────────────────────────────────────────────────────────

export async function obtenerPorId(id: string): Promise<Liquidacion> {
  const liq = await prisma.liquidacion.findUnique({ where: { id } });
  if (!liq) throw new ServiceError('NOT_FOUND', `Liquidación no encontrada: ${id}.`, { id });
  return liq;
}

export async function obtenerPorContrato(
  contratoId: string,
  opciones?: { incluirAnuladas?: boolean },
): Promise<Liquidacion | null> {
  return prisma.liquidacion.findFirst({
    where: {
      contratoId,
      ...(opciones?.incluirAnuladas ? {} : { anulada: false }),
    },
    orderBy: { fechaCalculo: 'desc' },
  });
}

export async function listarPorEmpresa(
  empresaId: string,
  filtros?: ListarLiquidacionesInput,
): Promise<{ datos: Liquidacion[]; total: number }> {
  const { incluirAnuladas, fechaCeseDesde, fechaCeseHasta, pagina, porPagina } =
    ListarLiquidacionesSchema.parse(filtros ?? {});

  const where: Prisma.LiquidacionWhereInput = {
    contrato: { empresaId },
    ...(incluirAnuladas ? {} : { anulada: false }),
    ...(fechaCeseDesde || fechaCeseHasta
      ? {
          fechaCese: {
            ...(fechaCeseDesde ? { gte: fechaCeseDesde } : {}),
            ...(fechaCeseHasta ? { lte: fechaCeseHasta } : {}),
          },
        }
      : {}),
  };

  const [datos, total] = await Promise.all([
    prisma.liquidacion.findMany({
      where,
      orderBy: { fechaCese: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.liquidacion.count({ where }),
  ]);

  return { datos, total };
}

// ── anular ────────────────────────────────────────────────────────────────────

export async function anular(id: string, input: AnularLiquidacionInput): Promise<Liquidacion> {
  const { motivoAnulacion } = AnularLiquidacionSchema.parse(input);
  const liq = await obtenerPorId(id);
  if (liq.anulada) {
    throw new ServiceError('INVALID_STATE', 'La liquidación ya está anulada.', { id });
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.liquidacion.update({
      where: { id },
      data: { anulada: true, anuladaEn: new Date(), motivoAnulacion },
    });
    await tx.contrato.update({
      where: { id: liq.contratoId },
      data: { activo: true, fechaFin: null, motivoCese: null },
    });
    return updated;
  });
}
