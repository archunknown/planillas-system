import 'server-only';
import { unauthorized, forbidden } from 'next/navigation';
import { getSession } from './dal';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) unauthorized();
  return session;
}

export async function requireRole(roles: Rol[]) {
  const session = await requireSession();
  if (!roles.includes(session!.user.rol as Rol)) forbidden();
  return session;
}

export async function requireOwnership(empresaId: string) {
  const session = await requireSession();
  const user = session!.user;
  if (user.rol === 'ADMIN') return session;
  if (!(user.empresasIds as string[]).includes(empresaId)) forbidden();
  return session;
}
