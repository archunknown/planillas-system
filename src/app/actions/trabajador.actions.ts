'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { safeAction } from '@/lib/actions/result';
import type { ActionResult } from '@/lib/actions/result';
import type { Trabajador, Hijo } from '@prisma/client';
import { z } from 'zod';
import { CrearTrabajadorSchema, ActualizarTrabajadorSchema } from '@/lib/validations/trabajador';
import { CrearHijoSchema, ActualizarHijoSchema } from '@/lib/validations/hijo';
import type {
  CrearTrabajadorInput,
  ActualizarTrabajadorInput,
  CrearTrabajadorConHijosInput,
  CrearHijoInput,
  ActualizarHijoInput,
} from '@/lib/services/trabajador.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverContextoHijo(hijoId: string): Promise<{ empresaId: string; trabajadorId: string }> {
  const hijo = await prisma.hijo.findUnique({
    where: { id: hijoId },
    select: { trabajadorId: true, trabajador: { select: { empresaId: true } } },
  });
  if (!hijo) throw new ServiceError('NOT_FOUND', `Hijo no encontrado: ${hijoId}.`, { hijoId });
  return { empresaId: hijo.trabajador.empresaId, trabajadorId: hijo.trabajadorId };
}

export async function crearTrabajadorAction(
  input: z.input<typeof CrearTrabajadorSchema>,
): Promise<ActionResult<Trabajador>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    await requireOwnership(input.empresaId);
    // z.coerce.date() input type is unknown; service.crear calls schema.parse() internally
    const result = await trabajadorService.crear(input as CrearTrabajadorInput);
    revalidatePath('/trabajadores');
    return result;
  });
}

export async function crearTrabajadorConHijosAction(
  input: CrearTrabajadorConHijosInput,
): Promise<ActionResult<unknown>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    await requireOwnership(input.trabajador.empresaId);
    const result = await trabajadorService.crearConHijos(input);
    revalidatePath('/trabajadores');
    return result;
  });
}

export async function actualizarTrabajadorAction(
  id: string,
  input: z.input<typeof ActualizarTrabajadorSchema>,
): Promise<ActionResult<Trabajador>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const t = await trabajadorService.obtenerPorId(id);
    await requireOwnership(t.empresaId);
    const result = await trabajadorService.actualizar(id, input as ActualizarTrabajadorInput);
    revalidatePath('/trabajadores');
    revalidatePath(`/trabajadores/${id}`);
    return result;
  });
}

export async function eliminarTrabajadorAction(id: string): Promise<ActionResult<Trabajador>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const t = await trabajadorService.obtenerPorId(id);
    await requireOwnership(t.empresaId);
    const result = await trabajadorService.eliminar(id);
    revalidatePath('/trabajadores');
    revalidatePath(`/trabajadores/${id}`);
    return result;
  });
}

export async function restaurarTrabajadorAction(id: string): Promise<ActionResult<Trabajador>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const t = await prisma.trabajador.findUnique({ where: { id }, select: { empresaId: true } });
    if (!t) throw new ServiceError('NOT_FOUND', `Trabajador no encontrado: ${id}.`, { id });
    await requireOwnership(t.empresaId);
    const result = await trabajadorService.restaurar(id);
    revalidatePath('/trabajadores');
    revalidatePath(`/trabajadores/${id}`);
    return result;
  });
}

export async function agregarHijoAction(
  trabajadorId: string,
  input: z.input<typeof CrearHijoSchema>,
): Promise<ActionResult<Hijo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const t = await trabajadorService.obtenerPorId(trabajadorId);
    await requireOwnership(t.empresaId);
    const result = await trabajadorService.agregarHijo(trabajadorId, input as CrearHijoInput);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}

export async function actualizarHijoAction(
  hijoId: string,
  input: z.input<typeof ActualizarHijoSchema>,
): Promise<ActionResult<Hijo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoHijo(hijoId);
    await requireOwnership(empresaId);
    const result = await trabajadorService.actualizarHijo(hijoId, input as ActualizarHijoInput);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}

export async function eliminarHijoAction(hijoId: string): Promise<ActionResult<Hijo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoHijo(hijoId);
    await requireOwnership(empresaId);
    const result = await trabajadorService.eliminarHijo(hijoId);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}
