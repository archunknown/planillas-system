// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.routerRefresh }),
}));
vi.mock('@/app/actions/contrato.actions', () => ({
  cerrarContratoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
// Avoid @base-ui Dialog portal issues in jsdom
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: React.ReactNode;
  }) => <div data-testid="dialog" data-open={String(open)}>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CerrarContratoDialog } from '../cerrar-contrato-dialog';
import * as actions from '@/app/actions/contrato.actions';

const mockCerrar = vi.mocked(actions.cerrarContratoAction);

beforeEach(() => vi.clearAllMocks());

describe('CerrarContratoDialog', () => {
  it('CC1 botón "Cerrar contrato" visible', () => {
    render(<CerrarContratoDialog contratoId="c1" cargo="Analista" />);
    expect(screen.getByRole('button', { name: /cerrar contrato/i })).toBeInTheDocument();
  });

  it('CC2 flujo completo: abrir → llenar → submit → acción + toast + refresh', async () => {
    mockCerrar.mockResolvedValue({ ok: true, data: {} as never });

    render(<CerrarContratoDialog contratoId="c1" cargo="Analista" />);

    // Abrir el dialog
    await userEvent.click(screen.getByRole('button', { name: /cerrar contrato/i }));

    // Dialog rendered (with mock always renders content)
    expect(screen.getByLabelText(/fecha de fin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo de cese/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/fecha de fin/i), {
      target: { value: '2025-12-31' },
    });
    fireEvent.change(screen.getByLabelText(/motivo de cese/i), {
      target: { value: 'Renuncia voluntaria' },
    });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockCerrar).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ motivoCese: 'Renuncia voluntaria' }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });

  it('CC3 submit vacío → aria-invalid en campos requeridos, acción no llamada', async () => {
    render(<CerrarContratoDialog contratoId="c1" cargo="Analista" />);
    await userEvent.click(screen.getByRole('button', { name: /cerrar contrato/i }));

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(screen.getByLabelText(/fecha de fin/i)).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(mockCerrar).not.toHaveBeenCalled();
  });
});
