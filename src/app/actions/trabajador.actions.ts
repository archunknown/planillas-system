'use server';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import type {
  CrearTrabajadorInput,
  ActualizarTrabajadorInput,
  CrearTrabajadorConHijosInput,
  CrearHijoInput,
  ActualizarHijoInput,
} from '@/lib/services/trabajador.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverEmpresaDeHijo(hijoId: string): Promise<string> {
  const hijo = await prisma.hijo.findUnique({
    where: { id: hijoId },
    select: { trabajador: { select: { empresaId: true } } },
  });
  if (!hijo) throw new ServiceError('NOT_FOUND', `Hijo no encontrado: ${hijoId}.`, { hijoId });
  return hijo.trabajador.empresaId;
}

export async function crearTrabajadorAction(input: CrearTrabajadorInput) {
  await requireRole(ROLES_ESCRITURA);
  await requireOwnership(input.empresaId);
  return trabajadorService.crear(input);
}

export async function crearTrabajadorConHijosAction(input: CrearTrabajadorConHijosInput) {
  await requireRole(ROLES_ESCRITURA);
  await requireOwnership(input.trabajador.empresaId);
  return trabajadorService.crearConHijos(input);
}

export async function actualizarTrabajadorAction(id: string, input: ActualizarTrabajadorInput) {
  await requireRole(ROLES_ESCRITURA);
  const t = await trabajadorService.obtenerPorId(id);
  await requireOwnership(t.empresaId);
  return trabajadorService.actualizar(id, input);
}

export async function eliminarTrabajadorAction(id: string) {
  await requireRole(ROLES_ESCRITURA);
  const t = await trabajadorService.obtenerPorId(id);
  await requireOwnership(t.empresaId);
  return trabajadorService.eliminar(id);
}

export async function restaurarTrabajadorAction(id: string) {
  await requireRole(ROLES_ESCRITURA);
  const t = await prisma.trabajador.findUnique({ where: { id }, select: { empresaId: true } });
  if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${id}.`, { id });
  await requireOwnership(t.empresaId);
  return trabajadorService.restaurar(id);
}

export async function agregarHijoAction(trabajadorId: string, input: CrearHijoInput) {
  await requireRole(ROLES_ESCRITURA);
  const t = await trabajadorService.obtenerPorId(trabajadorId);
  await requireOwnership(t.empresaId);
  return trabajadorService.agregarHijo(trabajadorId, input);
}

export async function actualizarHijoAction(hijoId: string, input: ActualizarHijoInput) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeHijo(hijoId);
  await requireOwnership(empresaId);
  return trabajadorService.actualizarHijo(hijoId, input);
}

export async function eliminarHijoAction(hijoId: string) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeHijo(hijoId);
  await requireOwnership(empresaId);
  return trabajadorService.eliminarHijo(hijoId);
}
