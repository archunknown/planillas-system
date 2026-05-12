'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';
import type { CrearEmpresaInput, ActualizarEmpresaInput } from '@/lib/services/empresa.service';
import { safeAction } from '@/lib/actions/result';
import type { ActionResult } from '@/lib/actions/result';
import type { Empresa } from '@prisma/client';

export async function crearEmpresaAction(input: CrearEmpresaInput): Promise<ActionResult<Empresa>> {
  return safeAction(async () => {
    await requireRole(['ADMIN']);
    const empresa = await empresaService.crear(input);
    revalidatePath('/empresas');
    return empresa;
  });
}

export async function actualizarEmpresaAction(
  id: string,
  input: ActualizarEmpresaInput,
): Promise<ActionResult<Empresa>> {
  return safeAction(async () => {
    await requireRole(['ADMIN']);
    const empresa = await empresaService.actualizar(id, input);
    revalidatePath('/empresas');
    revalidatePath(`/empresas/${id}`);
    return empresa;
  });
}

export async function eliminarEmpresaAction(id: string): Promise<ActionResult<Empresa>> {
  return safeAction(async () => {
    await requireRole(['ADMIN']);
    const empresa = await empresaService.eliminar(id);
    revalidatePath('/empresas');
    return empresa;
  });
}

export async function restaurarEmpresaAction(id: string): Promise<ActionResult<Empresa>> {
  return safeAction(async () => {
    await requireRole(['ADMIN']);
    const empresa = await empresaService.restaurar(id);
    revalidatePath('/empresas');
    return empresa;
  });
}
