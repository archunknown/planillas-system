'use server';
import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as contratoService from '@/lib/services/contrato.service';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import type {
  CrearContratoInput,
  ActualizarContratoInput,
  CerrarContratoInput,
} from '@/lib/services/contrato.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
const ROLES_ESCRITURA: Rol[] = ['ADMIN', 'CONTADOR'];

async function resolverEmpresaDeContrato(contratoId: string): Promise<string> {
  const c = await prisma.contrato.findUnique({ where: { id: contratoId }, select: { empresaId: true } });
  if (!c) throw new ServiceError('NOT_FOUND', `Contrato no encontrado: ${contratoId}.`, { contratoId });
  return c.empresaId;
}

export async function crearContratoAction(input: CrearContratoInput) {
  await requireRole(ROLES_ESCRITURA);
  await requireOwnership(input.empresaId);
  return contratoService.crear(input);
}

export async function actualizarContratoAction(id: string, input: ActualizarContratoInput) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeContrato(id);
  await requireOwnership(empresaId);
  return contratoService.actualizar(id, input);
}

export async function cerrarContratoAction(id: string, input: CerrarContratoInput) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeContrato(id);
  await requireOwnership(empresaId);
  return contratoService.cerrarContrato(id, input);
}

export async function eliminarContratoAction(id: string) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeContrato(id);
  await requireOwnership(empresaId);
  return contratoService.eliminar(id);
}

export async function restaurarContratoAction(id: string) {
  await requireRole(ROLES_ESCRITURA);
  const empresaId = await resolverEmpresaDeContrato(id);
  await requireOwnership(empresaId);
  return contratoService.restaurar(id);
}
