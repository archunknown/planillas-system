// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.mockPush }),
}));
vi.mock('@/app/actions/periodo.actions', () => ({
  abrirPeriodoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));

import { AbrirPeriodoForm } from '../abrir-periodo-form';
import * as actions from '@/app/actions/periodo.actions';

const mockAbrir = vi.mocked(actions.abrirPeriodoAction);

beforeEach(() => vi.clearAllMocks());

describe('AbrirPeriodoForm', () => {
  it('AP1 renders mes select, anio input and submit button', () => {
    render(<AbrirPeriodoForm empresaId="e1" />);
    expect(screen.getByLabelText(/mes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir período/i })).toBeInTheDocument();
  });

  it('AP2 submit with invalid anio → aria-invalid on anio field', async () => {
    render(<AbrirPeriodoForm empresaId="e1" />);

    fireEvent.change(screen.getByLabelText(/año/i), { target: { value: '2019' } });
    fireEvent.submit(screen.getByRole('button', { name: /abrir período/i }).closest('form')!);

    await waitFor(() =>
      expect(screen.getByLabelText(/año/i)).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(mockAbrir).not.toHaveBeenCalled();
  });

  it('AP3 happy path → action called + toast + router.push', async () => {
    mockAbrir.mockResolvedValue({ ok: true, data: { id: 'p1' } as never });

    render(<AbrirPeriodoForm empresaId="e1" />);

    fireEvent.change(screen.getByLabelText(/año/i), { target: { value: '2026' } });

    await userEvent.click(screen.getByRole('button', { name: /abrir período/i }));

    await waitFor(() =>
      expect(mockAbrir).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: 'e1', anio: 2026 }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.mockPush).toHaveBeenCalledWith('/planilla/p1'));
  });

  it('AP4 ServiceError DUPLICATE → error message shown', async () => {
    mockAbrir.mockResolvedValue({
      ok: false,
      error: 'El período ya está cerrado para esta empresa.',
      code: 'DUPLICATE',
    });

    render(<AbrirPeriodoForm empresaId="e1" />);
    await userEvent.click(screen.getByRole('button', { name: /abrir período/i }));

    await waitFor(() =>
      expect(screen.getByText(/ya está cerrado/i)).toBeInTheDocument(),
    );
    expect(mocks.mockPush).not.toHaveBeenCalled();
  });
});
