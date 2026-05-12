// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/app/actions/periodo.actions', () => ({
  actualizarInputsDetalleAction: vi.fn(),
  calcularPeriodoAction: vi.fn(),
  cerrarPeriodoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
// Avoid @base-ui Tooltip portal issues in jsdom
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}));
// Avoid @base-ui AlertDialog portal issues in jsdom
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({
    children,
    render: renderProp,
  }: {
    children: React.ReactNode;
    render?: React.ReactElement;
  }) =>
    renderProp ? React.cloneElement(renderProp, {}, children) : <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

import { DetallePeriodoTable, type DetalleNormalizado } from '../detalle-periodo-table';
import * as actions from '@/app/actions/periodo.actions';

const mockActualizar = vi.mocked(actions.actualizarInputsDetalleAction);

const detalle: DetalleNormalizado = {
  id: 'd1',
  diasTrabajados: 30,
  diasNoTrabajados: 0,
  horasExtras25: 0,
  horasExtras35: 0,
  horasExtras100: 0,
  minutosAtraso: 0,
  faltas: 0,
  feriados: 0,
  remuneracionBasica: 1500,
  horasExtrasTotal: 0,
  totalIngresos: 1500,
  totalDescuentos: 195,
  essalud: 135,
  netoPagar: 1305,
  contrato: {
    id: 'c1',
    trabajador: {
      apellidoPaterno: 'García',
      apellidoMaterno: 'López',
      nombres: 'Juan',
    },
  },
};

beforeEach(() => vi.clearAllMocks());

describe('DetallePeriodoTable', () => {
  it('DT1 estado ABIERTO — muestra inputs editables', () => {
    render(
      <DetallePeriodoTable
        detalles={[detalle]}
        periodoId="p1"
        estado="ABIERTO"
        canEdit={true}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]).not.toBeDisabled();
  });

  it('DT2 estado CALCULADO — muestra valores calculados', () => {
    render(
      <DetallePeriodoTable
        detalles={[detalle]}
        periodoId="p1"
        estado="CALCULADO"
        canEdit={true}
      />,
    );
    expect(screen.getByText(/1305\.00/)).toBeInTheDocument();
  });

  it('DT3 estado CERRADO — muestra columnas calculadas igual que CALCULADO', () => {
    render(
      <DetallePeriodoTable
        detalles={[detalle]}
        periodoId="p1"
        estado="CERRADO"
        canEdit={false}
      />,
    );
    expect(screen.getByText(/1500\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1305\.00/)).toBeInTheDocument();
  });

  it('DT4 canEdit=false — botón Guardar no visible en estado ABIERTO', () => {
    render(
      <DetallePeriodoTable
        detalles={[detalle]}
        periodoId="p1"
        estado="ABIERTO"
        canEdit={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });

  it('DT5 click Guardar → actualizarInputsDetalleAction llamada', async () => {
    mockActualizar.mockResolvedValue({ ok: true, data: {} as never });

    render(
      <DetallePeriodoTable
        detalles={[detalle]}
        periodoId="p1"
        estado="ABIERTO"
        canEdit={true}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(mockActualizar).toHaveBeenCalledWith(
        'd1',
        expect.objectContaining({ diasTrabajados: 30 }),
      ),
    );
  });

  it('DT6 lista vacía — muestra mensaje "No hay trabajadores"', () => {
    render(
      <DetallePeriodoTable
        detalles={[]}
        periodoId="p1"
        estado="ABIERTO"
        canEdit={true}
      />,
    );
    expect(screen.getByText(/no hay trabajadores/i)).toBeInTheDocument();
  });
});
