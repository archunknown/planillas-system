// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stable mock refs hoisted before vi.mock factories
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions/trabajador.actions', () => ({
  crearTrabajadorAction: vi.fn(),
  actualizarTrabajadorAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));

import { TrabajadorForm } from '../trabajador-form';
import * as actions from '@/app/actions/trabajador.actions';

const mockCrear = vi.mocked(actions.crearTrabajadorAction);
const mockActualizar = vi.mocked(actions.actualizarTrabajadorAction);

const TRABAJADOR_BASE = {
  id: 't1',
  empresaId: 'e1',
  dni: '12345678',
  apellidoPaterno: 'García',
  apellidoMaterno: 'López',
  nombres: 'Juan Carlos',
  fechaNacimiento: new Date('1990-05-15'),
  sexo: 'M',
  direccion: null,
  telefono: null,
  email: null,
  estadoCivil: null,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('TrabajadorForm modo=crear', () => {
  it('TF1 muestra campo DNI en modo crear', () => {
    render(<TrabajadorForm modo="crear" empresaId="e1" />);
    expect(screen.getByLabelText(/DNI/)).toBeInTheDocument();
  });

  it('TF2 muestra botón Crear trabajador', () => {
    render(<TrabajadorForm modo="crear" empresaId="e1" />);
    expect(screen.getByRole('button', { name: /crear trabajador/i })).toBeInTheDocument();
  });

  it('TF3 marca inputs inválidos al enviar vacío sin llamar a la acción', async () => {
    const user = userEvent.setup();
    render(<TrabajadorForm modo="crear" empresaId="e1" />);
    await user.click(screen.getByRole('button', { name: /crear trabajador/i }));
    await waitFor(() => {
      expect(document.querySelector('[aria-invalid="true"]')).toBeTruthy();
    });
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('TF4 submit válido invoca crearTrabajadorAction con datos correctos, toast y redirect', async () => {
    mockCrear.mockResolvedValue({ ok: true, data: TRABAJADOR_BASE as never });

    render(<TrabajadorForm modo="crear" empresaId="e1" />);

    fireEvent.change(screen.getByLabelText('DNI *'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Apellido paterno *'), { target: { value: 'García' } });
    fireEvent.change(screen.getByLabelText('Apellido materno *'), { target: { value: 'López' } });
    fireEvent.change(screen.getByLabelText('Nombres *'), { target: { value: 'Juan Carlos' } });
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento *'), {
      target: { value: '1990-05-15' },
    });
    fireEvent.change(screen.getByLabelText('Sexo *'), { target: { value: 'M' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: '12345678',
          apellidoPaterno: 'García',
          nombres: 'Juan Carlos',
        }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/trabajadores?empresaId=e1'));
  });
});

describe('TrabajadorForm modo=editar', () => {
  it('TF5 pre-rellena apellidoPaterno con datos del trabajador', () => {
    render(<TrabajadorForm modo="editar" trabajador={TRABAJADOR_BASE as never} />);
    const input = screen.getByLabelText('Apellido paterno *') as HTMLInputElement;
    expect(input.value).toBe('García');
  });

  it('TF6 botón submit deshabilitado cuando canEdit=false', () => {
    render(
      <TrabajadorForm modo="editar" trabajador={TRABAJADOR_BASE as never} canEdit={false} />,
    );
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeDisabled();
  });
});
