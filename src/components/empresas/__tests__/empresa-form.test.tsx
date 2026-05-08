// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions/empresa.actions', () => ({
  crearEmpresaAction: vi.fn(),
  actualizarEmpresaAction: vi.fn(),
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

  it('EF4 submit button visible y habilitado cuando isAdmin=true (default)', () => {
    render(<EmpresaForm modo="crear" />);
    const btn = screen.getByRole('button', { name: /crear empresa/i });
    expect(btn).not.toBeDisabled();
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
