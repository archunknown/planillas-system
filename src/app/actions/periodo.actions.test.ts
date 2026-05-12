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
vi.mock('@/lib/services/periodo.service', () => ({
  abrirPeriodo: vi.fn(),
  actualizarInputsDetalle: vi.fn(),
  calcularPeriodo: vi.fn(),
  cerrarPeriodo: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    periodo: { findUnique: vi.fn() },
    planillaDetalle: { findUnique: vi.fn() },
  },
}));

import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as periodoService from '@/lib/services/periodo.service';
import { prisma } from '@/lib/prisma';
import {
  abrirPeriodoAction,
  actualizarInputsDetalleAction,
  calcularPeriodoAction,
  cerrarPeriodoAction,
} from './periodo.actions';

const mockRequireRole = vi.mocked(requireRole);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockPeriodoFindUnique = vi.mocked(prisma.periodo.findUnique);
const mockDetalleFindUnique = vi.mocked(prisma.planillaDetalle.findUnique);
const mockAbrirPeriodo = vi.mocked(periodoService.abrirPeriodo);
const mockActualizarInputsDetalle = vi.mocked(periodoService.actualizarInputsDetalle);
const mockCalcularPeriodo = vi.mocked(periodoService.calcularPeriodo);
const mockCerrarPeriodo = vi.mocked(periodoService.cerrarPeriodo);

const PERIODO = { id: 'p1', empresaId: 'e1', mes: 3, anio: 2026, estado: 'ABIERTO' };
const DETALLE = { id: 'd1', periodoId: 'p1', contrato: { empresaId: 'e1' } };

beforeEach(() => vi.clearAllMocks());

describe('abrirPeriodoAction', () => {
  it('PA1 happy path — verifica requireOwnership con empresaId del input', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockAbrirPeriodo.mockResolvedValue(PERIODO as never);

    await abrirPeriodoAction({ empresaId: 'e1', mes: 3, anio: 2026 });

    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockAbrirPeriodo).toHaveBeenCalled();
  });

  it('PA2 sin sesión → unauthorized re-thrown', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));

    await expect(abrirPeriodoAction({ empresaId: 'e1', mes: 3, anio: 2026 })).rejects.toThrow('UNAUTHORIZED');
    expect(mockAbrirPeriodo).not.toHaveBeenCalled();
  });

  it('PA3 ownership violado → forbidden re-thrown', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));

    await expect(abrirPeriodoAction({ empresaId: 'e99', mes: 3, anio: 2026 })).rejects.toThrow('FORBIDDEN');
    expect(mockAbrirPeriodo).not.toHaveBeenCalled();
  });

  it('PA4 ServiceError DUPLICATE → { ok: false, code: "DUPLICATE" }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockAbrirPeriodo.mockRejectedValue(new ServiceError('DUPLICATE', 'El período ya está cerrado.'));

    const result = await abrirPeriodoAction({ empresaId: 'e1', mes: 3, anio: 2026 });

    expect(result).toEqual({ ok: false, error: 'El período ya está cerrado.', code: 'DUPLICATE' });
  });
});

describe('actualizarInputsDetalleAction', () => {
  it('PA5 happy path — resuelve empresaId y periodoId desde planillaDetalle', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockDetalleFindUnique.mockResolvedValue(DETALLE as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizarInputsDetalle.mockResolvedValue({ ...DETALLE, diasTrabajados: 25 } as never);

    await actualizarInputsDetalleAction('d1', { diasTrabajados: 25 });

    expect(mockDetalleFindUnique).toHaveBeenCalledWith({
      where: { id: 'd1' },
      select: { periodoId: true, contrato: { select: { empresaId: true } } },
    });
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockActualizarInputsDetalle).toHaveBeenCalledWith('d1', { diasTrabajados: 25 });
  });

  it('PA6 ServiceError INVALID_STATE → { ok: false, code: "INVALID_STATE" }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockDetalleFindUnique.mockResolvedValue(DETALLE as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizarInputsDetalle.mockRejectedValue(
      new ServiceError('INVALID_STATE', 'El período no está en estado ABIERTO.'),
    );

    const result = await actualizarInputsDetalleAction('d1', { diasTrabajados: 20 });

    expect(result).toEqual({
      ok: false,
      error: 'El período no está en estado ABIERTO.',
      code: 'INVALID_STATE',
    });
  });
});

describe('calcularPeriodoAction', () => {
  it('PA7 happy path — resuelve empresaId desde periodo', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockPeriodoFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCalcularPeriodo.mockResolvedValue({ ...PERIODO, estado: 'CALCULADO' } as never);

    await calcularPeriodoAction('p1');

    expect(mockPeriodoFindUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      select: { empresaId: true },
    });
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockCalcularPeriodo).toHaveBeenCalledWith('p1');
  });

  it('PA8 ServiceError NOT_FOUND → { ok: false, code: "NOT_FOUND" }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockPeriodoFindUnique.mockResolvedValue(null as never);

    const result = await calcularPeriodoAction('p99');

    expect(result).toEqual(
      expect.objectContaining({ ok: false, code: 'NOT_FOUND' }),
    );
    expect(mockCalcularPeriodo).not.toHaveBeenCalled();
  });
});

describe('cerrarPeriodoAction', () => {
  it('PA9 happy path — resuelve empresaId y cierra periodo', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockPeriodoFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCerrarPeriodo.mockResolvedValue({ ...PERIODO, estado: 'CERRADO' } as never);

    const result = await cerrarPeriodoAction('p1');

    expect(result).toEqual(expect.objectContaining({ ok: true }));
    expect(mockCerrarPeriodo).toHaveBeenCalledWith('p1');
  });

  it('PA10 ServiceError INVALID_STATE → { ok: false, code: "INVALID_STATE" }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockPeriodoFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCerrarPeriodo.mockRejectedValue(
      new ServiceError('INVALID_STATE', 'El período debe estar CALCULADO para cerrar.'),
    );

    const result = await cerrarPeriodoAction('p1');

    expect(result).toEqual({
      ok: false,
      error: 'El período debe estar CALCULADO para cerrar.',
      code: 'INVALID_STATE',
    });
  });

  it('PA11 ownership violado → forbidden re-thrown', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockPeriodoFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));

    await expect(cerrarPeriodoAction('p1')).rejects.toThrow('FORBIDDEN');
    expect(mockCerrarPeriodo).not.toHaveBeenCalled();
  });
});
