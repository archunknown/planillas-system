'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as liquidacionService from '@/lib/services/liquidacion.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { safeAction } from '@/lib/actions/result';
import type { ActionResult } from '@/lib/actions/result';
import type { Liquidacion } from '@prisma/client';
import type {
  CalcularLiquidacionInput,
  AnularLiquidacionInput,
} from '@/lib/services/liquidacion.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverContextoLiquidacion(
  liquidacionId: string,
): Promise<{ empresaId: string; contratoId: string }> {
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: { contratoId: true, contrato: { select: { empresaId: true } } },
  });
  if (!liq)
    throw new ServiceError('NOT_FOUND', `Liquidación no encontrada: ${liquidacionId}.`, {
      liquidacionId,
    });
  return { empresaId: liq.contrato.empresaId, contratoId: liq.contratoId };
}

export async function calcularLiquidacionAction(
  input: CalcularLiquidacionInput,
): Promise<ActionResult<Liquidacion>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const contrato = await prisma.contrato.findUnique({
      where: { id: input.contratoId },
      select: { empresaId: true },
    });
    if (!contrato)
      throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${input.contratoId}.`, {
        contratoId: input.contratoId,
      });
    await requireOwnership(contrato.empresaId);
    const result = await liquidacionService.calcular(input);
    revalidatePath('/liquidaciones');
    revalidatePath(`/liquidaciones/${result.id}`);
    revalidatePath(`/contratos/${input.contratoId}`);
    return result;
  });
}

export async function anularLiquidacionAction(
  id: string,
  input: AnularLiquidacionInput,
): Promise<ActionResult<Liquidacion>> {
  return safeAction(async () => {
    await requireRole(ROLES_ESCRITURA);
    const { empresaId, contratoId } = await resolverContextoLiquidacion(id);
    await requireOwnership(empresaId);
    const result = await liquidacionService.anular(id, input);
    revalidatePath('/liquidaciones');
    revalidatePath(`/liquidaciones/${id}`);
    revalidatePath(`/contratos/${contratoId}`);
    return result;
  });
}
