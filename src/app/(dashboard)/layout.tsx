import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/dal';
import { SidebarContent } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import * as empresaService from '@/lib/services/empresa.service';
import type { Empresa } from '@prisma/client';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    rol: Rol;
    empresasIds: string[];
  };

  // Load empresas accessible to this user
  let empresas: Empresa[] = [];
  if (user.rol === 'ADMIN') {
    const result = await empresaService.listar({ incluirEliminados: false, pagina: 1, porPagina: 100 });
    empresas = result.datos;
  } else {
    const ids = user.empresasIds ?? [];
    const resolved = await Promise.all(
      ids.map((id) => empresaService.obtenerPorId(id).catch(() => null))
    );
    empresas = resolved.filter(Boolean) as Empresa[];
  }

  const empresaActualId = empresas[0]?.id;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r bg-sidebar">
        <SidebarContent
          user={user}
          empresas={empresas}
          empresaActualId={empresaActualId}
        />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <MobileNav user={user} empresas={empresas} empresaActualId={empresaActualId} />
          <span className="text-sm font-semibold">Sistema Planillas</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
