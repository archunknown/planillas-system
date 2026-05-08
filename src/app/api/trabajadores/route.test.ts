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
vi.mock('@/lib/services/trabajador.service', () => ({
  listarPorEmpresa: vi.fn(),
}));

import { requireOwnership } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { NextResponse } from 'next/server';
import { GET } from './route';

const mockRequireOwnership = vi.mocked(requireOwnership);
const mockListar = vi.mocked(trabajadorService.listarPorEmpresa);
const mockNextResponseJson = vi.mocked(NextResponse.json);

const TRABAJADORES = [{ id: 't1' }, { id: 't2' }];

beforeEach(() => vi.clearAllMocks());

describe('GET /api/trabajadores', () => {
  it('RT1 happy path — pasa empresaId al ownership y al servicio', async () => {
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockListar.mockResolvedValue({ datos: TRABAJADORES, total: 2 } as never);
    await GET(new Request('http://localhost/api/trabajadores?empresaId=e1'));
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockListar).toHaveBeenCalledWith('e1');
    expect(mockNextResponseJson).toHaveBeenCalledWith({ datos: TRABAJADORES, total: 2 });
  });

  it('RT2 sin sesión → unauthorized', async () => {
    mockRequireOwnership.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(
      GET(new Request('http://localhost/api/trabajadores?empresaId=e1'))
    ).rejects.toThrow('UNAUTHORIZED');
    expect(mockListar).not.toHaveBeenCalled();
  });

  it('RT3 ownership violado → forbidden', async () => {
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(
      GET(new Request('http://localhost/api/trabajadores?empresaId=e99'))
    ).rejects.toThrow('FORBIDDEN');
    expect(mockListar).not.toHaveBeenCalled();
  });
});
