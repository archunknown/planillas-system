import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceError } from '@/lib/errors/service-error';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireRole: vi.fn(),
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/services/contrato.service', () => ({
  crear: vi.fn(),
  actualizar: vi.fn(),
  cerrarContrato: vi.fn(),
  eliminar: vi.fn(),
  restaurar: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contrato: { findUnique: vi.fn() },
  },
}));

import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as contratoService from '@/lib/services/contrato.service';
import { prisma } from '@/lib/prisma';
import {
  crearContratoAction,
  actualizarContratoAction,
  cerrarContratoAction,
  eliminarContratoAction,
  restaurarContratoAction,
} from './contrato.actions';

const mockRequireRole = vi.mocked(requireRole);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockContratofindUnique = vi.mocked(prisma.contrato.findUnique);
const mockCrear = vi.mocked(contratoService.crear);
const mockActualizar = vi.mocked(contratoService.actualizar);
const mockCerrar = vi.mocked(contratoService.cerrarContrato);
const mockEliminar = vi.mocked(contratoService.eliminar);
const mockRestaurar = vi.mocked(contratoService.restaurar);

const CONTRATO = { id: 'c1', empresaId: 'e1', trabajadorId: 't1' };

beforeEach(() => vi.clearAllMocks());

describe('crearContratoAction', () => {
  it('CA1 happy path — verifica ownership del empresaId del input', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCrear.mockResolvedValue(CONTRATO as never);
    await crearContratoAction({ empresaId: 'e1', trabajadorId: 't1' } as never);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockCrear).toHaveBeenCalled();
  });

  it('CA2 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(crearContratoAction({ empresaId: 'e1' } as never)).rejects.toThrow('UNAUTHORIZED');
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('CA3 rol no permitido → forbidden', async () => {
    mockRequireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearContratoAction({ empresaId: 'e1' } as never)).rejects.toThrow('FORBIDDEN');
  });

  it('CA4 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearContratoAction({ empresaId: 'e99' } as never)).rejects.toThrow('FORBIDDEN');
    expect(mockCrear).not.toHaveBeenCalled();
  });
});

describe('actualizarContratoAction', () => {
  it('CA5 happy path — resuelve empresaId desde DB', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(CONTRATO as never);
    await actualizarContratoAction('c1', {} as never);
    expect(mockContratofindUnique).toHaveBeenCalledWith({
      where: { id: 'c1' },
      select: { empresaId: true, trabajadorId: true },
    });
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockActualizar).toHaveBeenCalled();
  });

  it('CA6 ADMIN bypass ownership', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(CONTRATO as never);
    await actualizarContratoAction('c1', {} as never);
    expect(mockActualizar).toHaveBeenCalled();
  });

  it('CA7 CONTADOR sin ownership → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(actualizarContratoAction('c1', {} as never)).rejects.toThrow('FORBIDDEN');
    expect(mockActualizar).not.toHaveBeenCalled();
  });
});

describe('cerrarContratoAction', () => {
  it('CA8 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCerrar.mockResolvedValue(CONTRATO as never);
    await cerrarContratoAction('c1', {} as never);
    expect(mockCerrar).toHaveBeenCalledWith('c1', {});
  });

  it('CA9 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(cerrarContratoAction('c1', {} as never)).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('eliminarContratoAction', () => {
  it('CA10 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockEliminar.mockResolvedValue(CONTRATO as never);
    await eliminarContratoAction('c1');
    expect(mockEliminar).toHaveBeenCalledWith('c1');
  });
});

describe('restaurarContratoAction', () => {
  it('CA11 happy path — resuelve empresaId del contrato eliminado', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRestaurar.mockResolvedValue(CONTRATO as never);
    await restaurarContratoAction('c1');
    expect(mockRestaurar).toHaveBeenCalledWith('c1');
  });

  it('CA12 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(restaurarContratoAction('c1')).rejects.toThrow('FORBIDDEN');
    expect(mockRestaurar).not.toHaveBeenCalled();
  });
});

describe('safeAction wrapping — ServiceError → ActionResult', () => {
  it('CA-NEW1 crearContratoAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCrear.mockRejectedValue(new ServiceError('INVALID_STATE', 'Trabajador eliminado'));
    const result = await crearContratoAction({ empresaId: 'e1', trabajadorId: 't1' } as never);
    expect(result).toEqual({ ok: false, error: 'Trabajador eliminado', code: 'INVALID_STATE' });
  });

  it('CA-NEW2 actualizarContratoAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockRejectedValue(new ServiceError('NOT_FOUND', 'Contrato no encontrado: c99.'));
    const result = await actualizarContratoAction('c99', {} as never);
    expect(result).toEqual({ ok: false, error: 'Contrato no encontrado: c99.', code: 'NOT_FOUND' });
  });

  it('CA-NEW3 cerrarContratoAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1', trabajadorId: 't1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCerrar.mockRejectedValue(new ServiceError('INVALID_STATE', 'El contrato ya está cerrado.'));
    const result = await cerrarContratoAction('c1', {} as never);
    expect(result).toEqual({ ok: false, error: 'El contrato ya está cerrado.', code: 'INVALID_STATE' });
  });

  it('CA-NEW4 eliminarContratoAction contrato no encontrado → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue(null as never);
    const result = await eliminarContratoAction('c99');
    expect(result).toEqual({ ok: false, error: 'Contrato no encontrado: c99.', code: 'NOT_FOUND' });
  });
});
