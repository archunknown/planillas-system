'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as contratoService from '@/lib/services/contrato.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { safeAction } from '@/lib/actions/result';
import type { ActionResult } from '@/lib/actions/result';
import type { Contrato } from '@prisma/client';
import { z } from 'zod';
import { ActualizarContratoSchema, CerrarContratoSchema } from '@/lib/validations/contrato';
import type {
  CrearContratoInput,
  ActualizarContratoInput,
  CerrarContratoInput,
} from '@/lib/services/contrato.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverContextoContrato(
  contratoId: string,
): Promise<{ empresaId: string; trabajadorId: string }> {
  const c = await prisma.contrato.findUnique({
    where: { id: contratoId },
    select: { empresaId: true, trabajadorId: true },
  });
  if (!c) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${contratoId}.`, { contratoId });
  return { empresaId: c.empresaId, trabajadorId: c.trabajadorId };
}

export async function crearContratoAction(input: CrearContratoInput): Promise<ActionResult<Contrato>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    await requireOwnership(input.empresaId);
    const result = await contratoService.crear(input);
    revalidatePath('/contratos');
    revalidatePath(`/trabajadores/${input.trabajadorId}`);
    return result;
  });
}

export async function actualizarContratoAction(
  id: string,
  input: z.input<typeof ActualizarContratoSchema>,
): Promise<ActionResult<Contrato>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoContrato(id);
    await requireOwnership(empresaId);
    // z.coerce.date() input is unknown; service.actualizar calls schema.parse() internally
    const result = await contratoService.actualizar(id, input as ActualizarContratoInput);
    revalidatePath('/contratos');
    revalidatePath(`/contratos/${id}`);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}

export async function cerrarContratoAction(
  id: string,
  input: z.input<typeof CerrarContratoSchema>,
): Promise<ActionResult<Contrato>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoContrato(id);
    await requireOwnership(empresaId);
    // z.coerce.date() input is unknown; service.cerrarContrato calls schema.parse() internally
    const result = await contratoService.cerrarContrato(id, input as CerrarContratoInput);
    revalidatePath('/contratos');
    revalidatePath(`/contratos/${id}`);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}

export async function eliminarContratoAction(id: string): Promise<ActionResult<Contrato>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoContrato(id);
    await requireOwnership(empresaId);
    const result = await contratoService.eliminar(id);
    revalidatePath('/contratos');
    revalidatePath(`/contratos/${id}`);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}

export async function restaurarContratoAction(id: string): Promise<ActionResult<Contrato>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, trabajadorId } = await resolverContextoContrato(id);
    await requireOwnership(empresaId);
    const result = await contratoService.restaurar(id);
    revalidatePath('/contratos');
    revalidatePath(`/contratos/${id}`);
    revalidatePath(`/trabajadores/${trabajadorId}`);
    return result;
  });
}
