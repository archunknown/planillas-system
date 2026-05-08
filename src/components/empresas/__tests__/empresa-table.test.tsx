// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions/empresa.actions', () => ({
  eliminarEmpresaAction: vi.fn(),
  restaurarEmpresaAction: vi.fn(),
}));

import { EmpresaTable } from '../empresa-table';

const mkEmpresa = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  ruc: '20000000001',
  razonSocial: 'Test SA',
  nombreComercial: null,
  tipoEmpresa: 'SAC',
  direccion: 'Av. Test 123',
  distrito: 'Miraflores',
  provincia: 'Lima',
  departamento: 'Lima',
  telefono: null,
  email: null,
  activa: true,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('EmpresaTable', () => {
  it('ET1 muestra mensaje vacío cuando no hay empresas', () => {
    render(<EmpresaTable empresas={[]} isAdmin={false} />);
    expect(screen.getByText(/no hay empresas registradas/i)).toBeInTheDocument();
  });

  it('ET2 renderiza filas de empresas con RUC y razón social', () => {
    render(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={false} />);
    expect(screen.getByText('20000000001')).toBeInTheDocument();
    expect(screen.getByText('Test SA')).toBeInTheDocument();
  });

  it('ET3 muestra columna Acciones solo cuando isAdmin=true', () => {
    const { rerender } = render(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={true} />);
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    rerender(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={false} />);
    expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
  });

  it('ET4 muestra botón Editar y Eliminar para empresa activa (admin)', () => {
    render(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={true} />);
    expect(screen.getByRole('link', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('ET5 muestra botón Restaurar para empresa eliminada (admin)', () => {
    const eliminada = mkEmpresa({ eliminadoEn: new Date() });
    render(<EmpresaTable empresas={[eliminada as never]} isAdmin={true} />);
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar/i })).toBeInTheDocument();
  });

  it('ET6 muestra badge Eliminada para empresa con eliminadoEn', () => {
    const eliminada = mkEmpresa({ eliminadoEn: new Date() });
    render(<EmpresaTable empresas={[eliminada as never]} isAdmin={false} />);
    expect(screen.getByText('Eliminada')).toBeInTheDocument();
  });

  it('ET7 muestra badge Activa para empresa activa', () => {
    render(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={false} />);
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('ET8 muestra badge Inactiva para empresa inactiva no eliminada', () => {
    const inactiva = mkEmpresa({ activa: false });
    render(<EmpresaTable empresas={[inactiva as never]} isAdmin={false} />);
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('ET9 renderiza tipo de empresa con etiqueta legible', () => {
    render(<EmpresaTable empresas={[mkEmpresa() as never]} isAdmin={false} />);
    expect(screen.getByText('S.A.C.')).toBeInTheDocument();
  });
});
