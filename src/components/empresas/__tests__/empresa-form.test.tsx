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
vi.mock('@/app/actions/empresa.actions', () => ({
  crearEmpresaAction: vi.fn(),
  actualizarEmpresaAction: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
// Replace @base-ui Select with a native <select> — avoids portal/jsdom issues
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: {
    value?: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      data-testid="tipo-select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

import { EmpresaForm } from '../empresa-form';
import * as actions from '@/app/actions/empresa.actions';

const mockCrear = vi.mocked(actions.crearEmpresaAction);
const mockActualizar = vi.mocked(actions.actualizarEmpresaAction);

const EMPRESA_BASE = {
  id: 'e1',
  ruc: '20000000001',
  razonSocial: 'Test SA',
  nombreComercial: null,
  tipoEmpresa: 'SAC',
  direccion: 'Av. Test 123',
  distrito: 'Miraflores',
  provincia: 'Lima',
  departamento: 'Lima',
  telefono: null,
  email: null,
  activa: true,
  eliminadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('EmpresaForm modo=crear', () => {
  it('EF1 muestra campo RUC en modo crear', () => {
    render(<EmpresaForm modo="crear" />);
    expect(screen.getByLabelText(/RUC/)).toBeInTheDocument();
  });

  it('EF2 muestra botón Crear empresa', () => {
    render(<EmpresaForm modo="crear" />);
    expect(screen.getByRole('button', { name: /crear empresa/i })).toBeInTheDocument();
  });

  it('EF3 marca inputs inválidos al enviar vacío sin llamar a la acción', async () => {
    const user = userEvent.setup();
    render(<EmpresaForm modo="crear" />);
    await user.click(screen.getByRole('button', { name: /crear empresa/i }));
    await waitFor(() => {
      expect(document.querySelector('[aria-invalid="true"]')).toBeTruthy();
    });
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('EF4 submit válido invoca crearEmpresaAction con datos correctos, toast y redirect', async () => {
    mockCrear.mockResolvedValue({ ok: true, data: EMPRESA_BASE as never });

    render(<EmpresaForm modo="crear" />);

    // Use fireEvent (synchronous DOM events) for reliable RHF state updates in jsdom
    fireEvent.change(screen.getByLabelText('RUC *'), { target: { value: '20123456789' } });
    fireEvent.change(screen.getByLabelText('Razón social *'), { target: { value: 'Mi empresa SAC' } });
    fireEvent.change(screen.getByTestId('tipo-select'), { target: { value: 'SAC' } });
    fireEvent.change(screen.getByLabelText('Dirección *'), { target: { value: 'Av. Lima 123' } });
    fireEvent.change(screen.getByLabelText('Distrito *'), { target: { value: 'San Isidro' } });
    fireEvent.change(screen.getByLabelText('Provincia *'), { target: { value: 'Lima' } });
    fireEvent.change(screen.getByLabelText('Departamento *'), { target: { value: 'Lima' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          ruc: '20123456789',
          razonSocial: 'Mi empresa SAC',
          tipoEmpresa: 'SAC',
        }),
      ),
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/empresas'));
  });
});

describe('EmpresaForm modo=editar', () => {
  it('EF5 no muestra campo RUC en modo editar', () => {
    render(<EmpresaForm modo="editar" empresa={EMPRESA_BASE as never} />);
    expect(screen.queryByLabelText(/RUC/)).not.toBeInTheDocument();
  });

  it('EF6 pre-rellena razón social con datos de empresa', () => {
    render(<EmpresaForm modo="editar" empresa={EMPRESA_BASE as never} />);
    const input = screen.getByLabelText('Razón social *') as HTMLInputElement;
    expect(input.value).toBe('Test SA');
  });

  it('EF7 muestra botón Guardar cambios', () => {
    render(<EmpresaForm modo="editar" empresa={EMPRESA_BASE as never} />);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('EF8 botón submit deshabilitado cuando isAdmin=false', () => {
    render(<EmpresaForm modo="editar" empresa={EMPRESA_BASE as never} isAdmin={false} />);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeDisabled();
  });
});
