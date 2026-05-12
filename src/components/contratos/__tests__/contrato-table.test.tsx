// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/app/actions/contrato.actions', () => ({
  eliminarContratoAction: vi.fn(),
  restaurarContratoAction: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ContratoTable } from '../contrato-table';

const mkContrato = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  trabajadorId: 't1',
  empresaId: 'e1',
  regimenLaboral: 'GENERAL',
  tipoContrato: 'INDEFINIDO',
  fechaInicio: new Date('2024-01-01'),
  fechaFin: null,
  cargo: 'Analista',
  remuneracionBase: { toString: () => '3000.00' },
  frecuenciaPago: 'MENSUAL',
  sistemaPensionario: 'ONP',
  tieneAsignacionFamiliar: false,
  jornadaSemanal: 48,
  categoriaCC: 'NINGUNA',
  zonaBonificacion: null,
  recibeBETA: false,
  esTiempoParcial: false,
  motivoCese: null,
  activo: true,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  trabajador: { apellidoPaterno: 'García', apellidoMaterno: 'López', nombres: 'Juan', dni: '12345678' },
  ...overrides,
});

describe('ContratoTable', () => {
  it('CT1 muestra mensaje vacío cuando no hay contratos', () => {
    render(<ContratoTable contratos={[]} canEdit={false} />);
    expect(screen.getByText(/no hay contratos registrados/i)).toBeInTheDocument();
  });

  it('CT2 muestra cargo y nombre del trabajador', () => {
    render(<ContratoTable contratos={[mkContrato() as never]} canEdit={false} />);
    expect(screen.getByText('Analista')).toBeInTheDocument();
    expect(screen.getByText(/García López, Juan/i)).toBeInTheDocument();
  });

  it('CT3 columna Acciones visible con canEdit=true', () => {
    render(<ContratoTable contratos={[mkContrato() as never]} canEdit={true} />);
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('CT4 sin columna Acciones cuando canEdit=false', () => {
    render(<ContratoTable contratos={[mkContrato() as never]} canEdit={false} />);
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('CT5 contrato eliminado muestra badge Eliminado y botón Restaurar', () => {
    render(
      <ContratoTable
        contratos={[mkContrato({ eliminadoEn: new Date() }) as never]}
        canEdit={true}
      />,
    );
    expect(screen.getByText('Eliminado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar/i })).toBeInTheDocument();
  });
});
