'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as periodoService from '@/lib/services/periodo.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { safeAction } from '@/lib/actions/result';
import type { ActionResult } from '@/lib/actions/result';
import type { Periodo, PlanillaDetalle } from '@prisma/client';
import type {
  AbrirPeriodoInput,
  ActualizarInputsDetalleInput,
} from '@/lib/services/periodo.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverContextoPeriodo(periodoId: string): Promise<{ empresaId: string }> {
  const p = await prisma.periodo.findUnique({
    where: { id: periodoId },
    select: { empresaId: true },
  });
  if (!p) throw new ServiceError('NOT_FOUND', `Periodo no encontrado: ${periodoId}.`, { periodoId });
  return { empresaId: p.empresaId };
}

async function resolverContextoDetalle(
  detalleId: string,
): Promise<{ empresaId: string; periodoId: string }> {
  const d = await prisma.planillaDetalle.findUnique({
    where: { id: detalleId },
    select: { periodoId: true, contrato: { select: { empresaId: true } } },
  });
  if (!d)
    throw new ServiceError('NOT_FOUND', `Detalle no encontrado: ${detalleId}.`, { detalleId });
  return { empresaId: d.contrato.empresaId, periodoId: d.periodoId };
}

export async function abrirPeriodoAction(
  input: AbrirPeriodoInput,
): Promise<ActionResult<Periodo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    await requireOwnership(input.empresaId);
    const result = await periodoService.abrirPeriodo(input);
    revalidatePath('/planilla');
    revalidatePath(`/planilla/${result.id}`);
    return result;
  });
}

export async function actualizarInputsDetalleAction(
  detalleId: string,
  input: ActualizarInputsDetalleInput,
): Promise<ActionResult<PlanillaDetalle>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, periodoId } = await resolverContextoDetalle(detalleId);
    await requireOwnership(empresaId);
    const result = await periodoService.actualizarInputsDetalle(detalleId, input);
    revalidatePath(`/planilla/${periodoId}`);
    return result;
  });
}

export async function calcularPeriodoAction(
  periodoId: string,
): Promise<ActionResult<Periodo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId } = await resolverContextoPeriodo(periodoId);
    await requireOwnership(empresaId);
    const result = await periodoService.calcularPeriodo(periodoId);
    revalidatePath(`/planilla/${periodoId}`);
    return result;
  });
}

export async function cerrarPeriodoAction(
  periodoId: string,
): Promise<ActionResult<Periodo>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId } = await resolverContextoPeriodo(periodoId);
    await requireOwnership(empresaId);
    const result = await periodoService.cerrarPeriodo(periodoId);
    revalidatePath('/planilla');
    revalidatePath(`/planilla/${periodoId}`);
    return result;
  });
}
