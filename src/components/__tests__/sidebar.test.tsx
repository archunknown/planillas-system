// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/app/actions/auth.actions', () => ({ logoutAction: vi.fn() }));

import { SidebarContent } from '../sidebar';

const ADMIN_USER = { name: 'Admin', email: 'admin@test.com', rol: 'ADMIN' as const, empresasIds: ['e1'] };
const EMPRESA = { id: 'e1', razonSocial: 'Empresa Test', ruc: '20000000001' } as never;

describe('SidebarContent', () => {
  it('ADMIN ve los 6 links de navegación', () => {
    render(<SidebarContent user={ADMIN_USER} empresas={[EMPRESA]} empresaActualId="e1" />);
    expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /empresas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trabajadores/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contratos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planilla/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /liquidaciones/i })).toBeInTheDocument();
  });

  it('CLIENTE ve Planilla y Liquidaciones pero no Empresas', () => {
    const cliente = { ...ADMIN_USER, rol: 'CLIENTE' as const };
    render(<SidebarContent user={cliente} empresas={[EMPRESA]} empresaActualId="e1" />);
    expect(screen.getByRole('link', { name: /planilla/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /liquidaciones/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /empresas/i })).not.toBeInTheDocument();
  });
});
