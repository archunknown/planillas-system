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
vi.mock('@/lib/services/liquidacion.service', () => ({
  calcular: vi.fn(),
  anular: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contrato: { findUnique: vi.fn() },
    liquidacion: { findUnique: vi.fn() },
  },
}));

import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as liquidacionService from '@/lib/services/liquidacion.service';
import { prisma } from '@/lib/prisma';
import {
  calcularLiquidacionAction,
  anularLiquidacionAction,
} from './liquidacion.actions';

const mockRequireRole = vi.mocked(requireRole);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockContratofindUnique = vi.mocked(prisma.contrato.findUnique);
const mockLiquidacionFindUnique = vi.mocked(prisma.liquidacion.findUnique);
const mockCalcular = vi.mocked(liquidacionService.calcular);
const mockAnular = vi.mocked(liquidacionService.anular);

const LIQUIDACION = { id: 'l1', contratoId: 'c1', anulada: false };

beforeEach(() => vi.clearAllMocks());

describe('calcularLiquidacionAction', () => {
  it('LA1 happy path — resuelve empresa desde contrato', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCalcular.mockResolvedValue(LIQUIDACION as never);
    await calcularLiquidacionAction({ contratoId: 'c1', fechaCese: new Date(), motivoCese: 'x' } as never);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockCalcular).toHaveBeenCalled();
  });

  it('LA2 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(calcularLiquidacionAction({ contratoId: 'c1' } as never)).rejects.toThrow('UNAUTHORIZED');
    expect(mockCalcular).not.toHaveBeenCalled();
  });

  it('LA3 rol no permitido → forbidden', async () => {
    mockRequireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(calcularLiquidacionAction({ contratoId: 'c1' } as never)).rejects.toThrow('FORBIDDEN');
  });

  it('LA4 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(calcularLiquidacionAction({ contratoId: 'c1' } as never)).rejects.toThrow('FORBIDDEN');
    expect(mockCalcular).not.toHaveBeenCalled();
  });

  it('LA5 ADMIN bypass ownership', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockContratofindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCalcular.mockResolvedValue(LIQUIDACION as never);
    await calcularLiquidacionAction({ contratoId: 'c1', fechaCese: new Date() } as never);
    expect(mockCalcular).toHaveBeenCalled();
  });
});

describe('anularLiquidacionAction', () => {
  it('LA6 happy path — resuelve empresa vía liquidacion→contrato', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockLiquidacionFindUnique.mockResolvedValue({ contrato: { empresaId: 'e1' } } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockAnular.mockResolvedValue(LIQUIDACION as never);
    await anularLiquidacionAction('l1', { motivoAnulacion: 'error' });
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockAnular).toHaveBeenCalledWith('l1', { motivoAnulacion: 'error' });
  });

  it('LA7 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(anularLiquidacionAction('l1', { motivoAnulacion: 'x' })).rejects.toThrow('UNAUTHORIZED');
  });

  it('LA8 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockLiquidacionFindUnique.mockResolvedValue({ contrato: { empresaId: 'e1' } } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(anularLiquidacionAction('l1', { motivoAnulacion: 'x' })).rejects.toThrow('FORBIDDEN');
    expect(mockAnular).not.toHaveBeenCalled();
  });
});
