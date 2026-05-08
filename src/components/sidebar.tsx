'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  FileText,
  CalculatorIcon,
  BadgeDollarSign,
  LayoutDashboard,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions/auth.actions';
import type { Empresa } from '@prisma/client';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: <LayoutDashboard className="size-4" />, roles: ['ADMIN', 'CONTADOR', 'CLIENTE'] },
  { label: 'Empresas', href: '/empresas', icon: <Building2 className="size-4" />, roles: ['ADMIN'] },
  { label: 'Trabajadores', href: '/trabajadores', icon: <Users className="size-4" />, roles: ['ADMIN', 'CONTADOR', 'CLIENTE'] },
  { label: 'Contratos', href: '/contratos', icon: <FileText className="size-4" />, roles: ['ADMIN', 'CONTADOR', 'CLIENTE'] },
  { label: 'Planilla', href: '/planilla', icon: <CalculatorIcon className="size-4" />, roles: ['ADMIN', 'CONTADOR'] },
  { label: 'Liquidaciones', href: '/liquidaciones', icon: <BadgeDollarSign className="size-4" />, roles: ['ADMIN', 'CONTADOR', 'CLIENTE'] },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; rol: Rol; empresasIds: string[] };
  empresas: Empresa[];
  empresaActualId?: string;
}

export function SidebarContent({ user, empresas, empresaActualId: empresaActualIdProp }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlEmpresaId = searchParams.get('empresaId') ?? undefined;
  const empresaActualId = urlEmpresaId ?? empresaActualIdProp ?? empresas[0]?.id;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.rol));

  function buildHref(href: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (empresaActualId) params.set('empresaId', empresaActualId);
    const qs = params.toString();
    return qs ? `${href}?${qs}` : href;
  }

  function handleEmpresaChange(empresaId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('empresaId', empresaId);
    router.push(`${pathname}?${params.toString()}`);
  }

  const empresaActual = empresas.find((e) => e.id === empresaActualId) ?? empresas[0];
  const initials = (user.name ?? user.email ?? 'U').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Logo */}
      <div className="px-2 py-3">
        <span className="text-sm font-semibold tracking-tight">Sistema Planillas</span>
      </div>

      {/* Empresa selector */}
      {empresas.length > 0 && (
        <div className="px-1">
          {user.rol === 'ADMIN' && empresas.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="w-full justify-between text-xs truncate" />}>
                <span className="truncate">{empresaActual?.razonSocial ?? 'Seleccionar empresa'}</span>
                <ChevronDown className="ml-1 size-3 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {empresas.map((e) => (
                  <DropdownMenuItem key={e.id} onSelect={() => handleEmpresaChange(e.id)}>
                    <span className="truncate">{e.razonSocial}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="rounded-md border px-3 py-1.5">
              <p className="truncate text-xs font-medium">{empresaActual?.razonSocial ?? '—'}</p>
              <p className="truncate text-xs text-muted-foreground">{empresaActual?.ruc ?? ''}</p>
            </div>
          )}
        </div>
      )}

      <Separator className="my-1" />

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-1">
        {items.map((item) => {
          const href = buildHref(item.href);
          const active = pathname.startsWith(item.href) && item.href !== '/dashboard'
            ? true
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-1" />

      {/* User footer */}
      <div className="px-1">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user.name ?? user.email}</p>
            <p className="truncate text-xs text-muted-foreground">{user.rol}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" title="Cerrar sesión" className="text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
