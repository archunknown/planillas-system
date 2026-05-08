import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireRole: vi.fn(),
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/services/empresa.service', () => ({
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  restaurar: vi.fn(),
}));

import { requireRole } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';
import {
  crearEmpresaAction,
  actualizarEmpresaAction,
  eliminarEmpresaAction,
  restaurarEmpresaAction,
} from './empresa.actions';

const mockRequireRole = vi.mocked(requireRole);
const mockCrear = vi.mocked(empresaService.crear);
const mockActualizar = vi.mocked(empresaService.actualizar);
const mockEliminar = vi.mocked(empresaService.eliminar);
const mockRestaurar = vi.mocked(empresaService.restaurar);

const EMPRESA = { id: 'e1', razonSocial: 'Test SA', ruc: '20000000001' };

beforeEach(() => vi.clearAllMocks());

describe('crearEmpresaAction', () => {
  it('EA1 happy path — llama al servicio con rol ADMIN', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockCrear.mockResolvedValue(EMPRESA as never);
    const result = await crearEmpresaAction({ razonSocial: 'Test SA', ruc: '20000000001' } as never);
    expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN']);
    expect(result).toEqual(EMPRESA);
  });

  it('EA2 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(crearEmpresaAction({} as never)).rejects.toThrow('UNAUTHORIZED');
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('EA3 rol no permitido → forbidden', async () => {
    mockRequireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearEmpresaAction({} as never)).rejects.toThrow('FORBIDDEN');
    expect(mockCrear).not.toHaveBeenCalled();
  });
});

describe('actualizarEmpresaAction', () => {
  it('EA4 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(EMPRESA as never);
    const result = await actualizarEmpresaAction('e1', { razonSocial: 'Nuevo' } as never);
    expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN']);
    expect(result).toEqual(EMPRESA);
  });

  it('EA5 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(actualizarEmpresaAction('e1', {} as never)).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('eliminarEmpresaAction', () => {
  it('EA6 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockEliminar.mockResolvedValue(EMPRESA as never);
    await eliminarEmpresaAction('e1');
    expect(mockEliminar).toHaveBeenCalledWith('e1');
  });

  it('EA7 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(eliminarEmpresaAction('e1')).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('restaurarEmpresaAction', () => {
  it('EA8 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRestaurar.mockResolvedValue(EMPRESA as never);
    await restaurarEmpresaAction('e1');
    expect(mockRestaurar).toHaveBeenCalledWith('e1');
  });
});
