// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.routerRefresh }),
}));
vi.mock('@/app/actions/liquidacion.actions', () => ({
  anularLiquidacionAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, render: renderProp }: { children: React.ReactNode; render?: React.ReactElement }) =>
    renderProp ? React.cloneElement(renderProp, {}, children) : <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) =>
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

import { AnularLiquidacionDialog } from '../anular-liquidacion-dialog';
import * as actions from '@/app/actions/liquidacion.actions';

const mockAnular = vi.mocked(actions.anularLiquidacionAction);

beforeEach(() => vi.clearAllMocks());

describe('AnularLiquidacionDialog', () => {
  it('AL1 botón "Anular" visible', () => {
    render(<AnularLiquidacionDialog liquidacionId="l1" />);
    expect(screen.getByRole('button', { name: /^anular$/i })).toBeInTheDocument();
  });

  it('AL2 motivoAnulacion corto → error de validación, acción no llamada', async () => {
    render(<AnularLiquidacionDialog liquidacionId="l1" />);

    const textarea = screen.getByLabelText(/motivo de anulación/i);
    await userEvent.type(textarea, 'abc');

    await userEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }));

    await waitFor(() =>
      expect(screen.getByText(/mínimo 5 caracteres/i)).toBeInTheDocument(),
    );
    expect(mockAnular).not.toHaveBeenCalled();
  });

  it('AL3 happy path → acción + toast + router.refresh', async () => {
    mockAnular.mockResolvedValue({ ok: true, data: { id: 'l1', anulada: true } as never });

    render(<AnularLiquidacionDialog liquidacionId="l1" />);

    const textarea = screen.getByLabelText(/motivo de anulación/i);
    await userEvent.type(textarea, 'Error en el cálculo original');

    await userEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }));

    await waitFor(() => expect(mockAnular).toHaveBeenCalledWith('l1', { motivoAnulacion: 'Error en el cálculo original' }));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });

  it('AL4 ServiceError INVALID_STATE → mensaje en pantalla', async () => {
    mockAnular.mockResolvedValue({
      ok: false,
      error: 'La liquidación ya está anulada',
      code: 'INVALID_STATE',
    });

    render(<AnularLiquidacionDialog liquidacionId="l1" />);

    await userEvent.type(
      screen.getByLabelText(/motivo de anulación/i),
      'Intento de doble anulación',
    );
    await userEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }));

    await waitFor(() =>
      expect(screen.getByText(/la liquidación ya está anulada/i)).toBeInTheDocument(),
    );
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
  });
});
