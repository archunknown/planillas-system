import { Prisma, type Trabajador, type Hijo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import {
  CrearTrabajadorSchema,
  ActualizarTrabajadorSchema,
  ListarTrabajadoresSchema,
  CrearTrabajadorConHijosSchema,
  type CrearTrabajadorInput,
  type ActualizarTrabajadorInput,
  type ListarTrabajadoresInput,
  type CrearTrabajadorConHijosInput,
} from '@/lib/validations/trabajador';
import {
  CrearHijoSchema,
  ActualizarHijoSchema,
  type CrearHijoInput,
  type ActualizarHijoInput,
} from '@/lib/validations/hijo';

export type {
  CrearTrabajadorInput,
  ActualizarTrabajadorInput,
  ListarTrabajadoresInput,
  CrearTrabajadorConHijosInput,
  CrearHijoInput,
  ActualizarHijoInput,
};

function handlePrismaError(err: unknown, context?: Record<string, unknown>): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      throw new ServiceError('DUPLICATE', 'Ya existe un trabajador con ese DNI en la empresa.', context);
    }
    if (err.code === 'P2003') {
      throw new ServiceError('FOREIGN_KEY_VIOLATION', 'Referencia a entidad inexistente.', context);
    }
    if (err.code === 'P2025') {
      throw new ServiceError('NOT_FOUND', 'Registro no encontrado.', context);
    }
  }
  throw err;
}

async function verificarEmpresaActiva(empresaId: string): Promise<void> {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa || empresa.eliminadoEn !== null) {
    throw new ServiceError('FOREIGN_KEY_VIOLATION', `Empresa no encontrada o eliminada: ${empresaId}.`, { empresaId });
  }
}

// ── Trabajador ────────────────────────────────────────────────────────────────

export async function crear(input: CrearTrabajadorInput): Promise<Trabajador> {
  const data = CrearTrabajadorSchema.parse(input);
  await verificarEmpresaActiva(data.empresaId);
  try {
    return await prisma.trabajador.create({ data });
  } catch (err) {
    handlePrismaError(err, { dni: data.dni, empresaId: data.empresaId });
  }
}

export async function crearConHijos(
  input: CrearTrabajadorConHijosInput,
): Promise<Trabajador & { hijos: Hijo[] }> {
  const { trabajador: tData, hijos: hijosData } = CrearTrabajadorConHijosSchema.parse(input);
  await verificarEmpresaActiva(tData.empresaId);
  try {
    return await prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.create({ data: tData });
      const hijos = hijosData.length > 0
        ? await Promise.all(
            hijosData.map((h) => tx.hijo.create({ data: { ...h, trabajadorId: trabajador.id } })),
          )
        : [];
      return { ...trabajador, hijos };
    });
  } catch (err) {
    handlePrismaError(err, { dni: tData.dni, empresaId: tData.empresaId });
  }
}

export async function obtenerPorId(id: string): Promise<Trabajador> {
  const t = await prisma.trabajador.findFirst({ where: { id, eliminadoEn: null } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${id}.`, { id });
  return t;
}

export async function obtenerPorDniEmpresa(dni: string, empresaId: string): Promise<Trabajador> {
  const t = await prisma.trabajador.findFirst({
    where: { dni, empresaId, eliminadoEn: null },
  });
  if (!t) {
    throw new ServiceError('NOT_FOUND', `Trabajador DNI ${dni} no encontrado en empresa ${empresaId}.`, { dni, empresaId });
  }
  return t;
}

export async function listarPorEmpresa(
  empresaId: string,
  filtros?: ListarTrabajadoresInput,
): Promise<{ datos: Trabajador[]; total: number }> {
  const { incluirEliminados, pagina, porPagina } = ListarTrabajadoresSchema.parse(filtros ?? {});
  const where: Prisma.TrabajadorWhereInput = {
    empresaId,
    ...(incluirEliminados ? {} : { eliminadoEn: null }),
  };
  const [datos, total] = await Promise.all([
    prisma.trabajador.findMany({
      where,
      orderBy: [{ apellidoPaterno: 'asc' }, { apellidoMaterno: 'asc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.trabajador.count({ where }),
  ]);
  return { datos, total };
}

export async function actualizar(id: string, input: ActualizarTrabajadorInput): Promise<Trabajador> {
  const data = ActualizarTrabajadorSchema.parse(input);
  await obtenerPorId(id);
  try {
    return await prisma.trabajador.update({ where: { id }, data });
  } catch (err) {
    handlePrismaError(err, { id });
  }
}

export async function eliminar(id: string): Promise<Trabajador> {
  const t = await prisma.trabajador.findUnique({ where: { id } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${id}.`, { id });
  if (t.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'El trabajador ya fue eliminado.', { id });
  }
  return prisma.trabajador.update({ where: { id }, data: { eliminadoEn: new Date() } });
}

export async function restaurar(id: string): Promise<Trabajador> {
  const t = await prisma.trabajador.findUnique({ where: { id } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${id}.`, { id });
  if (t.eliminadoEn === null) {
    throw new ServiceError('INVALID_STATE', 'El trabajador no está eliminado.', { id });
  }
  return prisma.trabajador.update({ where: { id }, data: { eliminadoEn: null } });
}

// ── Hijo ──────────────────────────────────────────────────────────────────────

export async function agregarHijo(trabajadorId: string, input: CrearHijoInput): Promise<Hijo> {
  const data = CrearHijoSchema.parse(input);
  const t = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${trabajadorId}.`, { trabajadorId });
  return prisma.hijo.create({ data: { ...data, trabajadorId } });
}

export async function actualizarHijo(hijoId: string, input: ActualizarHijoInput): Promise<Hijo> {
  const data = ActualizarHijoSchema.parse(input);
  const hijo = await prisma.hijo.findFirst({ where: { id: hijoId, eliminadoEn: null } });
  if (!hijo) throw new ServiceError('NOT_FOUND', `Hijo no encontrado: ${hijoId}.`, { hijoId });
  return prisma.hijo.update({ where: { id: hijoId }, data });
}

export async function eliminarHijo(hijoId: string): Promise<Hijo> {
  const hijo = await prisma.hijo.findUnique({ where: { id: hijoId } });
  if (!hijo) throw new ServiceError('NOT_FOUND', `Hijo no encontrado: ${hijoId}.`, { hijoId });
  if (hijo.eliminadoEn !== null) {
    throw new ServiceError('INVALID_STATE', 'El hijo ya fue eliminado.', { hijoId });
  }
  return prisma.hijo.update({ where: { id: hijoId }, data: { eliminadoEn: new Date() } });
}

export async function listarHijos(
  trabajadorId: string,
  opciones?: { incluirEliminados?: boolean },
): Promise<Hijo[]> {
  return prisma.hijo.findMany({
    where: {
      trabajadorId,
      ...(opciones?.incluirEliminados ? {} : { eliminadoEn: null }),
    },
    orderBy: { fechaNacimiento: 'asc' },
  });
}
