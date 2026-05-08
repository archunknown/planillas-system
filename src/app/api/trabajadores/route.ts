import { NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get('empresaId') ?? '';
  await requireOwnership(empresaId);
  return NextResponse.json(await trabajadorService.listarPorEmpresa(empresaId));
}
