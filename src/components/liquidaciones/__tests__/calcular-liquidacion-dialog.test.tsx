// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));
vi.mock('@/app/actions/liquidacion.actions', () => ({
  calcularLiquidacionAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CalcularLiquidacionDialog } from '../calcular-liquidacion-dialog';
import * as actions from '@/app/actions/liquidacion.actions';

const mockCalcular = vi.mocked(actions.calcularLiquidacionAction);

beforeEach(() => vi.clearAllMocks());

describe('CalcularLiquidacionDialog', () => {
  it('CL1 renderiza input de fecha, textarea motivo y botón', () => {
    render(<CalcularLiquidacionDialog contratoId="c1" />);
    expect(screen.getByRole('button', { name: /calcular liquidación/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de cese/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo de cese/i)).toBeInTheDocument();
  });

  it('CL2 motivoCese corto → error de validación, acción no llamada', async () => {
    render(<CalcularLiquidacionDialog contratoId="c1" />);

    const motivoInput = screen.getByLabelText(/motivo de cese/i);
    await userEvent.clear(motivoInput);
    await userEvent.type(motivoInput, 'ab');

    const submitBtn = screen.getByRole('button', { name: /^calcular$/i });
    await userEvent.click(submitBtn);

    await waitFor(() =>
      expect(screen.getByText(/mín\. 3 caracteres/i)).toBeInTheDocument(),
    );
    expect(mockCalcular).not.toHaveBeenCalled();
  });

  it('CL3 happy path → acción + toast + router.push', async () => {
    mockCalcular.mockResolvedValue({ ok: true, data: { id: 'l1' } as never });

    render(<CalcularLiquidacionDialog contratoId="c1" />);

    const motivoInput = screen.getByLabelText(/motivo de cese/i);
    await userEvent.type(motivoInput, 'Renuncia voluntaria');

    const submitBtn = screen.getByRole('button', { name: /^calcular$/i });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(mockCalcular).toHaveBeenCalled());
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/liquidaciones/l1'));
  });

  it('CL4 ServiceError INVALID_STATE → mensaje de error en pantalla', async () => {
    mockCalcular.mockResolvedValue({
      ok: false,
      error: 'Ya existe una liquidación vigente',
      code: 'INVALID_STATE',
    });

    render(<CalcularLiquidacionDialog contratoId="c1" />);

    await userEvent.type(screen.getByLabelText(/motivo de cese/i), 'Renuncia');
    await userEvent.click(screen.getByRole('button', { name: /^calcular$/i }));

    await waitFor(() =>
      expect(screen.getByText(/ya existe una liquidación vigente/i)).toBeInTheDocument(),
    );
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });
});
