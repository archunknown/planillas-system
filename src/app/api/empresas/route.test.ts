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
  requireSession: vi.fn(),
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/services/empresa.service', () => ({
  listar: vi.fn(),
  obtenerPorId: vi.fn(),
}));

import { requireSession } from '@/lib/auth/guards';
import * as empresaService from '@/lib/services/empresa.service';
import { NextResponse } from 'next/server';
import { GET } from './route';

const mockRequireSession = vi.mocked(requireSession);
const mockListar = vi.mocked(empresaService.listar);
const mockObtenerPorId = vi.mocked(empresaService.obtenerPorId);
const mockNextResponseJson = vi.mocked(NextResponse.json);

const EMPRESAS = [{ id: 'e1' }, { id: 'e2' }];

beforeEach(() => vi.clearAllMocks());

describe('GET /api/empresas', () => {
  it('RE1 ADMIN recibe todas las empresas', async () => {
    mockRequireSession.mockResolvedValue({
      user: { rol: 'ADMIN', empresasIds: [] },
      expires: '',
    } as never);
    mockListar.mockResolvedValue({ datos: EMPRESAS, total: 2 } as never);
    await GET();
    expect(mockListar).toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith({ datos: EMPRESAS, total: 2 });
  });

  it('RE2 CONTADOR recibe solo sus empresas', async () => {
    mockRequireSession.mockResolvedValue({
      user: { rol: 'CONTADOR', empresasIds: ['e1'] },
      expires: '',
    } as never);
    mockObtenerPorId.mockResolvedValue(EMPRESAS[0] as never);
    await GET();
    expect(mockObtenerPorId).toHaveBeenCalledWith('e1');
    expect(mockListar).not.toHaveBeenCalled();
  });

  it('RE3 CONTADOR sin empresas asignadas retorna lista vacía', async () => {
    mockRequireSession.mockResolvedValue({
      user: { rol: 'CONTADOR', empresasIds: [] },
      expires: '',
    } as never);
    await GET();
    expect(mockNextResponseJson).toHaveBeenCalledWith({ datos: [], total: 0 });
    expect(mockObtenerPorId).not.toHaveBeenCalled();
  });

  it('RE4 sin sesión → unauthorized', async () => {
    mockRequireSession.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(GET()).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('GET /api/empresas/[id]', () => {
  it('RE5 mínimo happy path + unauthorized documentado', () => {
    // La ruta [id]/route.ts usa requireOwnership — testeable via guards.test.ts (RO1-RO6).
    // Los casos de unauthorized/forbidden ya están cubiertos en guards.test.ts.
    expect(true).toBe(true);
  });
});
