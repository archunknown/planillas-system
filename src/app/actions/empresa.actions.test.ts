import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
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
import { ServiceError } from '@/lib/errors/service-error';
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
  it('EA1 happy path — retorna ActionResult ok con la empresa', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockCrear.mockResolvedValue(EMPRESA as never);
    const result = await crearEmpresaAction({ razonSocial: 'Test SA', ruc: '20000000001' } as never);
    expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN']);
    expect(result).toEqual({ ok: true, data: EMPRESA });
  });

  it('EA2 sin sesión → re-lanza interrupt unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(crearEmpresaAction({} as never)).rejects.toThrow('UNAUTHORIZED');
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('EA3 rol no permitido → re-lanza interrupt forbidden', async () => {
    mockRequireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearEmpresaAction({} as never)).rejects.toThrow('FORBIDDEN');
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('EA-NEW1 ServiceError → retorna ActionResult fail', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockCrear.mockRejectedValue(new ServiceError('DUPLICATE', 'Ya existe una empresa con ese RUC.'));
    const result = await crearEmpresaAction({ razonSocial: 'Test SA', ruc: '20000000001' } as never);
    expect(result).toEqual({ ok: false, error: 'Ya existe una empresa con ese RUC.', code: 'DUPLICATE' });
  });
});

describe('actualizarEmpresaAction', () => {
  it('EA4 happy path — retorna ActionResult ok', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(EMPRESA as never);
    const result = await actualizarEmpresaAction('e1', { razonSocial: 'Nuevo' } as never);
    expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN']);
    expect(result).toEqual({ ok: true, data: EMPRESA });
  });

  it('EA5 sin sesión → re-lanza interrupt unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(actualizarEmpresaAction('e1', {} as never)).rejects.toThrow('UNAUTHORIZED');
  });

  it('EA-NEW2 ServiceError NOT_FOUND → retorna ActionResult fail', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockActualizar.mockRejectedValue(new ServiceError('NOT_FOUND', 'Empresa no encontrada.'));
    const result = await actualizarEmpresaAction('e1', {} as never);
    expect(result).toEqual({ ok: false, error: 'Empresa no encontrada.', code: 'NOT_FOUND' });
  });
});

describe('eliminarEmpresaAction', () => {
  it('EA6 happy path — retorna ActionResult ok', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockEliminar.mockResolvedValue(EMPRESA as never);
    const result = await eliminarEmpresaAction('e1');
    expect(mockEliminar).toHaveBeenCalledWith('e1');
    expect(result).toEqual({ ok: true, data: EMPRESA });
  });

  it('EA7 sin sesión → re-lanza interrupt unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(eliminarEmpresaAction('e1')).rejects.toThrow('UNAUTHORIZED');
  });

  it('EA-NEW3 ya eliminada → retorna ActionResult fail', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockEliminar.mockRejectedValue(new ServiceError('INVALID_STATE', 'La empresa ya fue eliminada.'));
    const result = await eliminarEmpresaAction('e1');
    expect(result).toEqual({ ok: false, error: 'La empresa ya fue eliminada.', code: 'INVALID_STATE' });
  });
});

describe('restaurarEmpresaAction', () => {
  it('EA8 happy path — retorna ActionResult ok', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRestaurar.mockResolvedValue(EMPRESA as never);
    const result = await restaurarEmpresaAction('e1');
    expect(mockRestaurar).toHaveBeenCalledWith('e1');
    expect(result).toEqual({ ok: true, data: EMPRESA });
  });

  it('EA-NEW4 no está eliminada → retorna ActionResult fail', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRestaurar.mockRejectedValue(new ServiceError('INVALID_STATE', 'La empresa no está eliminada.'));
    const result = await restaurarEmpresaAction('e1');
    expect(result).toEqual({ ok: false, error: 'La empresa no está eliminada.', code: 'INVALID_STATE' });
  });
});
