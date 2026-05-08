'use server';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as liquidacionService from '@/lib/services/liquidacion.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import type {
  CalcularLiquidacionInput,
  AnularLiquidacionInput,
} from '@/lib/services/liquidacion.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverEmpresaDeLiquidacion(liquidacionId: string): Promise<string> {
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: { contrato: { select: { empresaId: true } } },
  });
  if (!liq) throw new ServiceError('NOT_FOUND', `Liquidación no encontrada: ${liquidacionId}.`, { liquidacionId });
  return liq.contrato.empresaId;
}

export async function calcularLiquidacionAction(input: CalcularLiquidacionInput) {
  await requireRole(ROLES_ESCRITURA);
  const contrato = await prisma.contrato.findUnique({
    where: { id: input.contratoId },
    select: { empresaId: true },
  });
  if (!contrato) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${input.contratoId}.`, { contratoId: input.contratoId });
  await requireOwnership(contrato.empresaId);
  return liquidacionService.calcular(input);
}

export async function anularLiquidacionAction(id: string, input: AnularLiquidacionInput) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeLiquidacion(id);
  await requireOwnership(empresaId);
  return liquidacionService.anular(id, input);
}
