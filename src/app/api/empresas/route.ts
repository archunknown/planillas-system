import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';

export async function GET() {
  const session = await requireSession();
  const user = session!.user;

  if (user.rol === 'ADMIN') {
    return NextResponse.json(await empresaService.listar());
  }

  const ids = user.empresasIds as string[];
  if (ids.length === 0) return NextResponse.json({ datos: [], total: 0 });

  const resolved = await Promise.all(
    ids.map((id) => empresaService.obtenerPorId(id).catch(() => null))
  );
  const datos = resolved.filter(Boolean);
  return NextResponse.json({ datos, total: datos.length });
}
