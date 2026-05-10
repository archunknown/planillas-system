// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions/trabajador.actions', () => ({
  agregarHijoAction: vi.fn(),
  actualizarHijoAction: vi.fn(),
  eliminarHijoAction: vi.fn(),
}));

import { HijosSection } from '../hijos-section';

const mkHijo = (overrides: Record<string, unknown> = {}) => ({
  id: 'h1',
  trabajadorId: 't1',
  nombres: 'Pedro Ramírez',
  fechaNacimiento: new Date('2010-03-20'),
  dni: null,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('HijosSection', () => {
  it('HS1 muestra nombres de hijos cuando hay hijos', () => {
    render(
      <HijosSection trabajadorId="t1" hijos={[mkHijo() as never]} canEdit={false} />,
    );
    expect(screen.getByText('Pedro Ramírez')).toBeInTheDocument();
  });

  it('HS2 muestra mensaje vacío cuando no hay hijos', () => {
    render(<HijosSection trabajadorId="t1" hijos={[]} canEdit={false} />);
    expect(screen.getByText(/sin hijos registrados/i)).toBeInTheDocument();
  });

  it('HS3 muestra botón Agregar hijo cuando canEdit=true', () => {
    render(<HijosSection trabajadorId="t1" hijos={[]} canEdit={true} />);
    expect(screen.getByRole('button', { name: /agregar hijo/i })).toBeInTheDocument();
  });

  it('HS4 no muestra botón Agregar hijo cuando canEdit=false', () => {
    render(<HijosSection trabajadorId="t1" hijos={[]} canEdit={false} />);
    expect(screen.queryByRole('button', { name: /agregar hijo/i })).not.toBeInTheDocument();
  });
});
