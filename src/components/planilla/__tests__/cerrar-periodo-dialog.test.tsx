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
vi.mock('@/app/actions/periodo.actions', () => ({
  cerrarPeriodoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
// Avoid @base-ui AlertDialog portal issues in jsdom — always renders children
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

import { CerrarPeriodoDialog } from '../cerrar-periodo-dialog';
import * as actions from '@/app/actions/periodo.actions';

const mockCerrar = vi.mocked(actions.cerrarPeriodoAction);

beforeEach(() => vi.clearAllMocks());

describe('CerrarPeriodoDialog', () => {
  it('CP1 botón "Cerrar período" visible', () => {
    render(<CerrarPeriodoDialog periodoId="p1" />);
    expect(screen.getByRole('button', { name: /cerrar período/i })).toBeInTheDocument();
  });

  it('CP2 diálogo contiene texto "definitiva"', () => {
    render(<CerrarPeriodoDialog periodoId="p1" />);
    expect(screen.getByText(/definitiva/i)).toBeInTheDocument();
  });

  it('CP3 confirmar → cerrarPeriodoAction + toast + router.refresh', async () => {
    mockCerrar.mockResolvedValue({ ok: true, data: { id: 'p1', estado: 'CERRADO' } as never });

    render(<CerrarPeriodoDialog periodoId="p1" />);

    const confirmBtn = screen.getByRole('button', { name: /confirmar cierre/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => expect(mockCerrar).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });
});
