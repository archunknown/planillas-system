import { NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireOwnership(id);
  return NextResponse.json(await empresaService.obtenerPorId(id));
}
