'use server';
import { requireRole } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';
import type { CrearEmpresaInput, ActualizarEmpresaInput } from '@/lib/services/empresa.service';

export async function crearEmpresaAction(input: CrearEmpresaInput) {
  await requireRole(['ADMIN']);
  return empresaService.crear(input);
}

export async function actualizarEmpresaAction(id: string, input: ActualizarEmpresaInput) {
  await requireRole(['ADMIN']);
  return empresaService.actualizar(id, input);
}

export async function eliminarEmpresaAction(id: string) {
  await requireRole(['ADMIN']);
  return empresaService.eliminar(id);
}

export async function restaurarEmpresaAction(id: string) {
  await requireRole(['ADMIN']);
  return empresaService.restaurar(id);
}
