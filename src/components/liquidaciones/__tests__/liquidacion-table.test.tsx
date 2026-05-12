// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/app/actions/liquidacion.actions', () => ({
  anularLiquidacionAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-trigger">{children}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
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
  AlertDialogAction: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    <button onClick={onClick} disabled={disabled}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

import { LiquidacionTable } from '../liquidacion-table';
import type { LiquidacionConTrabajador } from '../liquidacion-table';

const makeLiq = (overrides: Partial<LiquidacionConTrabajador> = {}): LiquidacionConTrabajador => ({
  id: 'l1',
  fechaCese: new Date('2025-12-31'),
  ctsTrunca: 500,
  gratificacionTrunca: 300,
  vacacionesTruncas: 200,
  totalNeto: 1000,
  anulada: false,
  contrato: {
    id: 'c1',
    trabajador: {
      apellidoPaterno: 'García',
      apellidoMaterno: 'López',
      nombres: 'Juan',
    },
  },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('LiquidacionTable', () => {
  it('LT1 liquidación vigente — trabajador + badge Vigente + botón Anular visibles', () => {
    render(<LiquidacionTable liquidaciones={[makeLiq()]} canEdit={true} />);
    expect(screen.getByText(/garcía lópez, juan/i)).toBeInTheDocument();
    expect(screen.getByText('Vigente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^anular$/i })).toBeInTheDocument();
  });

  it('LT2 anulada → badge Anulada + sin botón Anular', () => {
    render(<LiquidacionTable liquidaciones={[makeLiq({ anulada: true })]} canEdit={true} />);
    expect(screen.getByText('Anulada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^anular$/i })).not.toBeInTheDocument();
  });

  it('LT3 canEdit=false → sin botón Anular', () => {
    render(<LiquidacionTable liquidaciones={[makeLiq()]} canEdit={false} />);
    expect(screen.queryByRole('button', { name: /^anular$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/garcía/i)).toBeInTheDocument();
  });

  it('LT4 lista vacía → "No hay liquidaciones"', () => {
    render(<LiquidacionTable liquidaciones={[]} canEdit={true} />);
    expect(screen.getByText(/no hay liquidaciones/i)).toBeInTheDocument();
  });
});
