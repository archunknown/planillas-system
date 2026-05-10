// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stable mock refs hoisted before vi.mock factories
const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.routerRefresh }),
}));
vi.mock('@/app/actions/trabajador.actions', () => ({
  agregarHijoAction: vi.fn(),
  actualizarHijoAction: vi.fn(),
  eliminarHijoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
// Avoid @base-ui AlertDialog portal issues in jsdom
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, onOpenChange, children }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: React.ReactNode;
  }) => <div data-testid="alert-dialog" data-open={String(open)}>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick, disabled }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
}));

import { HijosSection } from '../hijos-section';
import * as actions from '@/app/actions/trabajador.actions';

const mockAgregar = vi.mocked(actions.agregarHijoAction);
const mockEliminar = vi.mocked(actions.eliminarHijoAction);

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

describe('HijosSection — renderizado', () => {
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

describe('HijosSection — mutaciones', () => {
  it('HS-MUT1 agregar hijo: acción invocada + toast + refresh', async () => {
    mockAgregar.mockResolvedValue({ ok: true, data: mkHijo() as never });

    render(<HijosSection trabajadorId="t1" hijos={[]} canEdit={true} />);

    await userEvent.click(screen.getByRole('button', { name: /agregar hijo/i }));

    // Inline form appears
    expect(screen.getByLabelText('Nombres *')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nombres *'), {
      target: { value: 'Pedro García' },
    });
    fireEvent.change(screen.getByLabelText('F. nacimiento *'), {
      target: { value: '2015-03-10' },
    });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockAgregar).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ nombres: 'Pedro García' }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });

  it('HS-MUT2 eliminar hijo: acción invocada + refresh', async () => {
    mockEliminar.mockResolvedValue({ ok: true, data: mkHijo() as never });

    render(
      <HijosSection trabajadorId="t1" hijos={[mkHijo() as never]} canEdit={true} />,
    );

    // EliminarHijoDialog trigger: the AlertDialogTrigger wraps around a Button "Eliminar"
    // With our mock, trigger = passthrough, so the button rendered inside is accessible
    const eliminarBtns = screen.getAllByRole('button', { name: /eliminar/i });
    // First Eliminar button is the trigger; click it to open the dialog
    await userEvent.click(eliminarBtns[0]);

    // The AlertDialogAction "Eliminar" button inside the dialog
    const allEliminar = screen.getAllByRole('button', { name: /eliminar/i });
    // After dialog "opens" (data-open=true, content always rendered with our mock), find the action btn
    const actionBtn = allEliminar.find(
      (btn) => btn.getAttribute('data-testid') !== 'alert-dialog',
    ) ?? allEliminar[allEliminar.length - 1];
    await userEvent.click(actionBtn);

    await waitFor(() => expect(mockEliminar).toHaveBeenCalledWith('h1'));
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });
});
