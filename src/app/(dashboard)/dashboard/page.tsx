import { getSession } from '@/lib/auth/dal';
import { logoutAction } from '@/app/actions/auth.actions';

export default async function DashboardPage() {
  const session = await getSession();
  const user = session!.user;

  return (
    <main>
      <p>
        Sesión: {user.email} · Rol: {user.rol}
      </p>
      <form action={logoutAction}>
        <button type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
