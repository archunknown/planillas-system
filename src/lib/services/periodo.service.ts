import { Prisma, type Periodo, type PlanillaDetalle } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { calcularPlanillaPeriodo } from './planilla.service';
import {
  AbrirPeriodoSchema,
  ActualizarInputsDetalleSchema,
  ListarPeriodosSchema,
  type AbrirPeriodoInput,
  type ActualizarInputsDetalleInput,
  type ListarPeriodosInput,
} from '@/lib/validations/periodo';

export type { AbrirPeriodoInput, ActualizarInputsDetalleInput, ListarPeriodosInput };

const periodoConDetallesInclude = {
  detalles: {
    include: {
      contrato: {
        include: {
          trabajador: true,
        },
      },
    },
  },
} as const;

export type PeriodoConDetalles = Prisma.PeriodoGetPayload<{
  include: typeof periodoConDetallesInclude;
}>;

export async function abrirPeriodo(input: AbrirPeriodoInput): Promise<Periodo> {
  const { empresaId, mes, anio } = AbrirPeriodoSchema.parse(input);

  const existente = await prisma.periodo.findUnique({
    where: { empresaId_mes_anio: { empresaId, mes, anio } },
  });

  if (existente) {
    if (existente.estado === 'CERRADO') {
      throw new ServiceError(
        'DUPLICATE',
        `El periodo ${mes}/${anio} ya está cerrado para esta empresa.`,
        { empresaId, mes, anio },
      );
    }
    return existente;
  }

  return prisma.$transaction(async (tx) => {
    const periodo = await tx.periodo.create({ data: { empresaId, mes, anio } });

    const fechaPeriodo = new Date(Date.UTC(anio, mes - 1, 1));
    const ultimoDia = new Date(Date.UTC(anio, mes, 0));

    const contratos = await tx.contrato.findMany({
      where: {
        empresaId,
        activo: true,
        eliminadoEn: null,
        fechaInicio: { lte: ultimoDia },
        OR: [{ fechaFin: null }, { fechaFin: { gte: fechaPeriodo } }],
      },
    });

    for (const contrato of contratos) {
      await tx.planillaDetalle.create({
        data: {
          periodoId: periodo.id,
          contratoId: contrato.id,
          remuneracionBasica: 0,
          totalIngresos: 0,
          totalDescuentos: 0,
          totalAportesEmpleador: 0,
          netoPagar: 0,
        },
      });
    }

    return periodo;
  });
}

export async function listarPeriodos(
  input: ListarPeriodosInput,
): Promise<{ items: Periodo[]; total: number }> {
  const { empresaId, anio, estado, pagina, porPagina } = ListarPeriodosSchema.parse(input);

  const where: Prisma.PeriodoWhereInput = {
    empresaId,
    ...(anio !== undefined && { anio }),
    ...(estado !== undefined && { estado }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.periodo.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.periodo.count({ where }),
  ]);

  return { items, total };
}

export async function obtenerPeriodoConDetalles(periodoId: string): Promise<PeriodoConDetalles> {
  const periodo = await prisma.periodo.findUnique({
    where: { id: periodoId },
    include: periodoConDetallesInclude,
  });

  if (!periodo) {
    throw new ServiceError('NOT_FOUND', `Periodo no encontrado: ${periodoId}.`, { periodoId });
  }

  return periodo;
}

export async function actualizarInputsDetalle(
  planillaDetalleId: string,
  input: ActualizarInputsDetalleInput,
): Promise<PlanillaDetalle> {
  const data = ActualizarInputsDetalleSchema.parse(input);

  const detalle = await prisma.planillaDetalle.findUnique({
    where: { id: planillaDetalleId },
    include: { periodo: true },
  });

  if (!detalle) {
    throw new ServiceError(
      'NOT_FOUND',
      `PlanillaDetalle no encontrado: ${planillaDetalleId}.`,
      { planillaDetalleId },
    );
  }

  if (detalle.periodo.estado !== 'ABIERTO') {
    throw new ServiceError(
      'INVALID_STATE',
      `Solo se pueden editar inputs de un periodo ABIERTO (estado actual: ${detalle.periodo.estado}).`,
      { planillaDetalleId, estado: detalle.periodo.estado },
    );
  }

  return prisma.planillaDetalle.update({
    where: { id: planillaDetalleId },
    data: {
      ...(data.diasTrabajados !== undefined && { diasTrabajados: data.diasTrabajados }),
      ...(data.diasNoTrabajados !== undefined && { diasNoTrabajados: data.diasNoTrabajados }),
      ...(data.horasExtras25 !== undefined && { horasExtras25: data.horasExtras25 }),
      ...(data.horasExtras35 !== undefined && { horasExtras35: data.horasExtras35 }),
      ...(data.horasExtras100 !== undefined && { horasExtras100: data.horasExtras100 }),
      ...(data.minutosAtraso !== undefined && { minutosAtraso: data.minutosAtraso }),
      ...(data.faltas !== undefined && { faltas: data.faltas }),
      ...(data.feriados !== undefined && { feriados: data.feriados }),
    },
  });
}

export async function calcularPeriodo(periodoId: string): Promise<Periodo> {
  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });

  if (!periodo) {
    throw new ServiceError('NOT_FOUND', `Periodo no encontrado: ${periodoId}.`, { periodoId });
  }

  await calcularPlanillaPeriodo(periodo.empresaId, periodo.mes, periodo.anio);

  return prisma.periodo.findUniqueOrThrow({ where: { id: periodoId } });
}

export async function cerrarPeriodo(periodoId: string): Promise<Periodo> {
  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });

  if (!periodo) {
    throw new ServiceError('NOT_FOUND', `Periodo no encontrado: ${periodoId}.`, { periodoId });
  }

  if (periodo.estado !== 'CALCULADO') {
    throw new ServiceError(
      'INVALID_STATE',
      `El periodo debe estar CALCULADO para poder cerrarse (estado actual: ${periodo.estado}).`,
      { periodoId, estado: periodo.estado },
    );
  }

  return prisma.periodo.update({
    where: { id: periodoId },
    data: { estado: 'CERRADO' },
  });
}
