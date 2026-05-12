// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush, refresh: mocks.routerRefresh }),
}));
vi.mock('@/app/actions/contrato.actions', () => ({
  crearContratoAction: vi.fn(),
  actualizarContratoAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));

import { ContratoForm } from '../contrato-form';
import * as actions from '@/app/actions/contrato.actions';

const mockCrear = vi.mocked(actions.crearContratoAction);
const mockActualizar = vi.mocked(actions.actualizarContratoAction);

const mkContrato = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  trabajadorId: 't1',
  empresaId: 'e1',
  regimenLaboral: 'GENERAL',
  tipoContrato: 'INDEFINIDO',
  fechaInicio: new Date('2024-01-01'),
  fechaFin: null,
  cargo: 'Analista Senior',
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

const TRABAJADORES = [
  { id: 't1', apellidoPaterno: 'García', apellidoMaterno: 'López', nombres: 'Juan' },
];

beforeEach(() => vi.clearAllMocks());

describe('ContratoForm — crear modo', () => {
  it('CF1 campo cargo visible en modo crear', () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
      />,
    );
    expect(screen.getByLabelText(/cargo/i)).toBeInTheDocument();
  });

  it('CF2 botón "Crear contrato" visible', () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
      />,
    );
    expect(screen.getByRole('button', { name: /crear contrato/i })).toBeInTheDocument();
  });

  it('CF3 submit vacío → cargo aria-invalid, acción no llamada', async () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
      />,
    );
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByLabelText(/cargo/i)).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('CF4 submit válido → acción invocada + toast + router.push', async () => {
    mockCrear.mockResolvedValue({ ok: true, data: mkContrato() as never });

    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
        trabajadorIdDefault="t1"
      />,
    );

    fireEvent.change(screen.getByLabelText(/trabajador \*/i), { target: { value: 't1' } });
    fireEvent.change(screen.getByLabelText(/régimen \*/i), { target: { value: 'GENERAL' } });
    fireEvent.change(screen.getByLabelText(/tipo contrato \*/i), { target: { value: 'INDEFINIDO' } });
    fireEvent.change(screen.getByLabelText(/f\. inicio \*/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/cargo \*/i), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText(/remuneración \*/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/frecuencia pago \*/i), { target: { value: 'MENSUAL' } });
    fireEvent.change(screen.getByLabelText(/sist\. pensionario \*/i), { target: { value: 'ONP' } });
    fireEvent.change(screen.getByLabelText(/jornada semanal/i), { target: { value: '48' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({ cargo: 'Analista', empresaId: 'e1' }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.routerPush).toHaveBeenCalledWith(
        expect.stringContaining('/contratos?empresaId=e1'),
      ),
    );
  });

  it('CF5 trabajadorIdDefault pre-selecciona el trabajador', () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
        trabajadorIdDefault="t1"
      />,
    );
    expect(screen.getByLabelText(/trabajador \*/i)).toHaveValue('t1');
  });

  it('CF6 regimenLaboral=CONSTRUCCION_CIVIL muestra Categoría CC', async () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
      />,
    );
    fireEvent.change(screen.getByLabelText(/régimen \*/i), {
      target: { value: 'CONSTRUCCION_CIVIL' },
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/categoría cc/i)).toBeInTheDocument(),
    );
  });

  it('CF7 regimenLaboral=AGRARIO muestra recibeBETA checkbox', async () => {
    render(
      <ContratoForm
        modo="crear"
        empresaId="e1"
        trabajadores={TRABAJADORES}
      />,
    );
    fireEvent.change(screen.getByLabelText(/régimen \*/i), { target: { value: 'AGRARIO' } });
    await waitFor(() =>
      expect(screen.getByText(/recibe beta/i)).toBeInTheDocument(),
    );
  });
});

describe('ContratoForm — editar modo', () => {
  it('CF8 modo editar pre-rellena cargo', () => {
    render(
      <ContratoForm
        modo="editar"
        contratoId="c1"
        contrato={mkContrato() as never}
        canEdit={true}
      />,
    );
    expect(screen.getByLabelText(/cargo/i)).toHaveValue('Analista Senior');
  });

  it('CF9 submit editar válido → actualizarContratoAction + toast + refresh', async () => {
    mockActualizar.mockResolvedValue({ ok: true, data: mkContrato() as never });

    render(
      <ContratoForm
        modo="editar"
        contratoId="c1"
        contrato={mkContrato() as never}
        canEdit={true}
      />,
    );

    fireEvent.change(screen.getByLabelText(/cargo/i), { target: { value: 'Analista Modificado' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockActualizar).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ cargo: 'Analista Modificado' }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.routerRefresh).toHaveBeenCalled());
  });
});
