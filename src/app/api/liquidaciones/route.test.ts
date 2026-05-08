import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('next/server', () => ({
  NextResponse: { json: vi.fn((data: unknown) => ({ _body: data })) },
}));
vi.mock('@/lib/auth/guards', () => ({
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/services/liquidacion.service', () => ({
  listarPorEmpresa: vi.fn(),
}));

import { requireOwnership } from '@/lib/auth/guards';
import * as liquidacionService from '@/lib/services/liquidacion.service';
import { NextResponse } from 'next/server';
import { GET } from './route';

const mockRequireOwnership = vi.mocked(requireOwnership);
const mockListar = vi.mocked(liquidacionService.listarPorEmpresa);
const mockNextResponseJson = vi.mocked(NextResponse.json);

beforeEach(() => vi.clearAllMocks());

describe('GET /api/liquidaciones', () => {
  it('RL1 happy path', async () => {
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockListar.mockResolvedValue({ datos: [], total: 0 } as never);
    await GET(new Request('http://localhost/api/liquidaciones?empresaId=e1'));
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockListar).toHaveBeenCalledWith('e1');
    expect(mockNextResponseJson).toHaveBeenCalledWith({ datos: [], total: 0 });
  });

  it('RL2 sin sesión → unauthorized', async () => {
    mockRequireOwnership.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(
      GET(new Request('http://localhost/api/liquidaciones?empresaId=e1'))
    ).rejects.toThrow('UNAUTHORIZED');
    expect(mockListar).not.toHaveBeenCalled();
  });

  it('RL3 ownership violado → forbidden', async () => {
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(
      GET(new Request('http://localhost/api/liquidaciones?empresaId=e99'))
    ).rejects.toThrow('FORBIDDEN');
  });
});
