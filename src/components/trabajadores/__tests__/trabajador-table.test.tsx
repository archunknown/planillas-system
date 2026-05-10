// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions/trabajador.actions', () => ({
  eliminarTrabajadorAction: vi.fn(),
  restaurarTrabajadorAction: vi.fn(),
}));

import { TrabajadorTable } from '../trabajador-table';

const mkTrabajador = (overrides: Record<string, unknown> = {}) => ({
  id: 't1',
  empresaId: 'e1',
  dni: '12345678',
  apellidoPaterno: 'García',
  apellidoMaterno: 'López',
  nombres: 'Juan Carlos',
  fechaNacimiento: new Date('1990-05-15'),
  sexo: 'M',
  direccion: null,
  telefono: null,
  email: null,
  estadoCivil: null,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('TrabajadorTable', () => {
  it('TT1 muestra mensaje vacío cuando no hay trabajadores', () => {
    render(<TrabajadorTable trabajadores={[]} canEdit={false} />);
    expect(screen.getByText(/no hay trabajadores registrados/i)).toBeInTheDocument();
  });

  it('TT2 renderiza filas con DNI y apellidos+nombres', () => {
    render(<TrabajadorTable trabajadores={[mkTrabajador() as never]} canEdit={false} />);
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText(/García López/)).toBeInTheDocument();
  });

  it('TT3 muestra columna Acciones solo cuando canEdit=true', () => {
    const { rerender } = render(
      <TrabajadorTable trabajadores={[mkTrabajador() as never]} canEdit={true} />,
    );
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    rerender(<TrabajadorTable trabajadores={[mkTrabajador() as never]} canEdit={false} />);
    expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
  });

  it('TT4 muestra botón Editar y Eliminar para trabajador activo (canEdit)', () => {
    render(<TrabajadorTable trabajadores={[mkTrabajador() as never]} canEdit={true} />);
    // nativeButton={false} → @base-ui adds role="button" to the <a> element
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('TT5 muestra botón Restaurar para trabajador eliminado (canEdit)', () => {
    const eliminado = mkTrabajador({ eliminadoEn: new Date() });
    render(<TrabajadorTable trabajadores={[eliminado as never]} canEdit={true} />);
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar/i })).toBeInTheDocument();
  });
});
