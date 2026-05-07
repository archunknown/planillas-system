// activa: flag de negocio (empresa activa/inactiva como cliente del estudio).
// eliminadoEn: soft-delete administrativo. Son semánticas ortogonales:
//   listados siempre filtran eliminadoEn=null salvo incluirEliminados=true.
//   activa no afecta visibilidad en listados base.
import { Prisma, type Empresa } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import {
  CrearEmpresaSchema,
  ActualizarEmpresaSchema,
  ListarEmpresasSchema,
  type CrearEmpresaInput,
  type ActualizarEmpresaInput,
  type ListarEmpresasInput,
} from '@/lib/validations/empresa';

export type { CrearEmpresaInput, ActualizarEmpresaInput, ListarEmpresasInput };

function handlePrismaError(err: unknown, context?: Record<string, unknown>): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      throw new ServiceError('DUPLICATE', 'Ya existe una empresa con ese RUC.', context);
    }
    if (err.code === 'P2003') {
      throw new ServiceError('FOREIGN_KEY_VIOLATION', 'Referencia a entidad inexistente.', context);
    }
    if (err.code === 'P2025') {
      throw new ServiceError('NOT_FOUND', 'Empresa no encontrada.', context);
    }
  }
  throw err;
}

export async function crear(input: CrearEmpresaInput): Promise<Empresa> {
  const data = CrearEmpresaSchema.parse(input);
  try {
    return await prisma.empresa.create({ data });
  } catch (err) {
    handlePrismaError(err, { ruc: data.ruc });
  }
}

export async function obtenerPorId(id: string): Promise<Empresa> {
  const empresa = await prisma.empresa.findFirst({
    where: { id, eliminadoEn: null },
  });
  if (!empresa) throw new ServiceError('NOT_FOUND', `Empresa no encontrada: ${id}.`, { id });
  return empresa;
}

export async function obtenerPorRuc(ruc: string): Promise<Empresa> {
  const empresa = await prisma.empresa.findFirst({
    where: { ruc, eliminadoEn: null },
  });
  if (!empresa) throw new ServiceError('NOT_FOUND', `Empresa no encontrada con RUC: ${ruc}.`, { ruc });
  return empresa;
}

export async function listar(filtros?: ListarEmpresasInput): Promise<{ datos: Empresa[]; total: number }> {
  const { incluirEliminados, soloActivas, pagina, porPagina } = ListarEmpresasSchema.parse(filtros ?? {});
  const where: Prisma.EmpresaWhereInput = {
    ...(incluirEliminados ? {} : { eliminadoEn: null }),
    ...(soloActivas !== undefined ? { activa: soloActivas } : {}),
  };
  const [datos, total] = await Promise.all([
    prisma.empresa.findMany({
      where,
      orderBy: { razonSocial: 'asc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.empresa.count({ where }),
  ]);
  return { datos, total };
}

export async function actualizar(id: string, input: ActualizarEmpresaInput): Promise<Empresa> {
  const data = ActualizarEmpresaSchema.parse(input);
  await obtenerPorId(id);
  try {
    return await prisma.empresa.update({ where: { id }, data });
  } catch (err) {
    handlePrismaError(err, { id });
  }
}

export async function eliminar(id: string): Promise<Empresa> {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new ServiceError('NOT_FOUND', `Empresa no encontrada: ${id}.`, { id });
  if (empresa.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'La empresa ya fue eliminada.', { id });
  }
  return prisma.empresa.update({ where: { id }, data: { eliminadoEn: new Date() } });
}

export async function restaurar(id: string): Promise<Empresa> {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new ServiceError('NOT_FOUND', `Empresa no encontrada: ${id}.`, { id });
  if (empresa.eliminadoEn === null) {
    throw new ServiceError('INVALID_STATE', 'La empresa no está eliminada.', { id });
  }
  return prisma.empresa.update({ where: { id }, data: { eliminadoEn: null } });
}
