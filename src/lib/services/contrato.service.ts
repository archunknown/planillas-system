// Semántica ortogonal de activo / eliminadoEn en Contrato:
//   activo=false, eliminadoEn=null  → cerrado válidamente (reemplazado o cesado)
//   activo=true,  eliminadoEn≠null  → eliminado lógico antes de ser cerrado
//   activo=false, eliminadoEn≠null  → cerrado y luego eliminado
// Listados filtran eliminadoEn=null por defecto.
// El motor de cálculo (planilla.service) solo lee contratos con activo=true.
import { Prisma, type Contrato } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import {
  CrearContratoSchema,
  ActualizarContratoSchema,
  ListarContratosSchema,
  CerrarContratoSchema,
  remuneracionToDecimal,
  type CrearContratoInput,
  type ActualizarContratoInput,
  type ListarContratosInput,
  type CerrarContratoInput,
} from '@/lib/validations/contrato';

export type { CrearContratoInput, ActualizarContratoInput, ListarContratosInput, CerrarContratoInput };

function handlePrismaError(err: unknown, context?: Record<string, unknown>): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      throw new ServiceError('FOREIGN_KEY_VIOLATION', 'Referencia a entidad inexistente.', context);
    }
    if (err.code === 'P2025') {
      throw new ServiceError('NOT_FOUND', 'Contrato no encontrado.', context);
    }
  }
  throw err;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

async function verificarTrabajadorDisponible(trabajadorId: string): Promise<void> {
  const t = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${trabajadorId}.`, { trabajadorId });
  if (t.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'No se puede contratar a un trabajador eliminado.', { trabajadorId });
  }
}

// ── Contrato ─────────────────────────────────────────────────────────────────

export async function crear(input: CrearContratoInput): Promise<Contrato> {
  const data = CrearContratoSchema.parse(input);
  await verificarTrabajadorDisponible(data.trabajadorId);

  try {
    return await prisma.$transaction(async (tx) => {
      // Cerrar contrato activo previo del mismo trabajador, si existe
      const previo = await tx.contrato.findFirst({
        where: { trabajadorId: data.trabajadorId, activo: true, eliminadoEn: null },
      });
      if (previo) {
        await tx.contrato.update({
          where: { id: previo.id },
          data: {
            activo: false,
            fechaFin: previo.fechaFin ?? new Date(),
            motivoCese: 'Reemplazado por nuevo contrato',
          },
        });
      }

      return tx.contrato.create({
        data: {
          ...data,
          remuneracionBase: remuneracionToDecimal(data.remuneracionBase),
          activo: true,
        },
      });
    });
  } catch (err) {
    handlePrismaError(err, { trabajadorId: data.trabajadorId, empresaId: data.empresaId });
  }
}

export async function obtenerPorId(id: string): Promise<Contrato> {
  // Listado base: filtra eliminadoEn=null (ver semántica al inicio del archivo)
  const c = await prisma.contrato.findFirst({ where: { id, eliminadoEn: null } });
  if (!c) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${id}.`, { id });
  return c;
}

export async function obtenerActivoPorTrabajador(trabajadorId: string): Promise<Contrato> {
  const c = await prisma.contrato.findFirst({
    where: { trabajadorId, activo: true, eliminadoEn: null },
  });
  if (!c) {
    throw new ServiceError('NOT_FOUND', `No hay contrato activo para trabajador: ${trabajadorId}.`, { trabajadorId });
  }
  return c;
}

export async function listarPorTrabajador(
  trabajadorId: string,
  filtros?: ListarContratosInput,
): Promise<{ datos: Contrato[]; total: number }> {
  // Listado por trabajador: filtra eliminadoEn=null salvo incluirEliminados=true
  const { incluirEliminados, soloActivos, pagina, porPagina } = ListarContratosSchema.parse(filtros ?? {});
  const where: Prisma.ContratoWhereInput = {
    trabajadorId,
    ...(incluirEliminados ? {} : { eliminadoEn: null }),
    ...(soloActivos !== undefined ? { activo: soloActivos } : {}),
  };
  const [datos, total] = await Promise.all([
    prisma.contrato.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.contrato.count({ where }),
  ]);
  return { datos, total };
}

export async function listarPorEmpresa(
  empresaId: string,
  filtros?: ListarContratosInput,
): Promise<{ datos: Contrato[]; total: number }> {
  // Listado por empresa (join vía trabajador): filtra eliminadoEn=null salvo incluirEliminados=true
  const { incluirEliminados, soloActivos, pagina, porPagina } = ListarContratosSchema.parse(filtros ?? {});
  const where: Prisma.ContratoWhereInput = {
    empresaId,
    ...(incluirEliminados ? {} : { eliminadoEn: null }),
    ...(soloActivos !== undefined ? { activo: soloActivos } : {}),
  };
  const [datos, total] = await Promise.all([
    prisma.contrato.findMany({
      where,
      orderBy: [{ trabajadorId: 'asc' }, { fechaInicio: 'desc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.contrato.count({ where }),
  ]);
  return { datos, total };
}

export async function actualizar(id: string, input: ActualizarContratoInput): Promise<Contrato> {
  // Inmutables: trabajadorId, empresaId, regimenLaboral, fechaInicio (ver JSDoc)
  const data = ActualizarContratoSchema.parse(input);
  await obtenerPorId(id);
  const prismaData: Prisma.ContratoUpdateInput = {
    ...data,
    ...(data.remuneracionBase !== undefined
      ? { remuneracionBase: remuneracionToDecimal(data.remuneracionBase) }
      : {}),
  };
  try {
    return await prisma.contrato.update({ where: { id }, data: prismaData });
  } catch (err) {
    handlePrismaError(err, { id });
  }
}

export async function cerrarContrato(id: string, input: CerrarContratoInput): Promise<Contrato> {
  const data = CerrarContratoSchema.parse(input);
  const contrato = await obtenerPorId(id);
  if (!contrato.activo) {
    throw new ServiceError('INVALID_STATE', 'El contrato ya está cerrado.', { id });
  }
  return prisma.contrato.update({
    where: { id },
    data: { activo: false, fechaFin: data.fechaFin, motivoCese: data.motivoCese },
  });
}

export async function eliminar(id: string): Promise<Contrato> {
  const c = await prisma.contrato.findUnique({ where: { id } });
  if (!c) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${id}.`, { id });
  if (c.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'El contrato ya fue eliminado.', { id });
  }
  return prisma.contrato.update({ where: { id }, data: { eliminadoEn: new Date() } });
}

export async function restaurar(id: string): Promise<Contrato> {
  const c = await prisma.contrato.findUnique({ where: { id } });
  if (!c) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${id}.`, { id });
  if (c.eliminadoEn === null) {
    throw new ServiceError('INVALID_STATE', 'El contrato no está eliminado.', { id });
  }
  return prisma.contrato.update({ where: { id }, data: { eliminadoEn: null } });
}
