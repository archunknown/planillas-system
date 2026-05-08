import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('./dal', () => ({
  getSession: vi.fn(),
}));

import { unauthorized, forbidden } from 'next/navigation';
import { getSession } from './dal';
import { requireSession, requireRole, requireOwnership } from './guards';

const mockGetSession = vi.mocked(getSession);
const mockUnauthorized = vi.mocked(unauthorized);
const mockForbidden = vi.mocked(forbidden);

const SESSION_ADMIN = {
  user: { id: 'u1', email: 'admin@test.pe', name: 'Admin', rol: 'ADMIN', empresasIds: [] },
  expires: '2026-06-01T00:00:00.000Z',
};

const SESSION_CONTADOR = {
  user: { id: 'u2', email: 'cont@test.pe', name: 'Cont', rol: 'CONTADOR', empresasIds: ['e1', 'e2'] },
  expires: '2026-06-01T00:00:00.000Z',
};

const SESSION_CLIENTE = {
  user: { id: 'u3', email: 'cli@test.pe', name: 'Cli', rol: 'CLIENTE', empresasIds: ['e3'] },
  expires: '2026-06-01T00:00:00.000Z',
};

beforeEach(() => vi.clearAllMocks());

// ─── requireSession ───────────────────────────────────────────────────────────
describe('requireSession', () => {
  it('RS1 retorna la sesión cuando el usuario está autenticado', async () => {
    mockGetSession.mockResolvedValue(SESSION_ADMIN as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireSession();
    expect(result).toEqual(SESSION_ADMIN);
  });

  it('RS2 llama unauthorized() cuando no hay sesión', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(requireSession()).rejects.toThrow('UNAUTHORIZED');
    expect(mockUnauthorized).toHaveBeenCalledOnce();
  });

  it('RS3 llama unauthorized() cuando session.user es undefined', async () => {
    mockGetSession.mockResolvedValue({ expires: '2026-06-01' } as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    await expect(requireSession()).rejects.toThrow('UNAUTHORIZED');
    expect(mockUnauthorized).toHaveBeenCalledOnce();
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────
describe('requireRole', () => {
  it('RR1 retorna sesión cuando el rol coincide', async () => {
    mockGetSession.mockResolvedValue(SESSION_ADMIN as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireRole(['ADMIN']);
    expect(result).toEqual(SESSION_ADMIN);
  });

  it('RR2 retorna sesión cuando el rol está entre los permitidos', async () => {
    mockGetSession.mockResolvedValue(SESSION_CONTADOR as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireRole(['ADMIN', 'CONTADOR']);
    expect(result).toEqual(SESSION_CONTADOR);
  });

  it('RR3 llama forbidden() cuando el rol no está permitido', async () => {
    mockGetSession.mockResolvedValue(SESSION_CLIENTE as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    await expect(requireRole(['ADMIN'])).rejects.toThrow('FORBIDDEN');
    expect(mockForbidden).toHaveBeenCalledOnce();
  });

  it('RR4 llama unauthorized() cuando no hay sesión', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(requireRole(['ADMIN'])).rejects.toThrow('UNAUTHORIZED');
    expect(mockUnauthorized).toHaveBeenCalledOnce();
  });
});

// ─── requireOwnership ────────────────────────────────────────────────────────
describe('requireOwnership', () => {
  it('RO1 ADMIN pasa sin importar empresaId', async () => {
    mockGetSession.mockResolvedValue(SESSION_ADMIN as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireOwnership('empresa-cualquiera');
    expect(result).toEqual(SESSION_ADMIN);
    expect(mockForbidden).not.toHaveBeenCalled();
  });

  it('RO2 CONTADOR con empresaId en su lista pasa', async () => {
    mockGetSession.mockResolvedValue(SESSION_CONTADOR as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireOwnership('e1');
    expect(result).toEqual(SESSION_CONTADOR);
    expect(mockForbidden).not.toHaveBeenCalled();
  });

  it('RO3 CONTADOR sin empresaId en su lista llama forbidden()', async () => {
    mockGetSession.mockResolvedValue(SESSION_CONTADOR as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    await expect(requireOwnership('e99')).rejects.toThrow('FORBIDDEN');
    expect(mockForbidden).toHaveBeenCalledOnce();
  });

  it('RO4 CLIENTE con empresaId en su lista pasa', async () => {
    mockGetSession.mockResolvedValue(SESSION_CLIENTE as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    const result = await requireOwnership('e3');
    expect(result).toEqual(SESSION_CLIENTE);
    expect(mockForbidden).not.toHaveBeenCalled();
  });

  it('RO5 CLIENTE sin empresaId en su lista llama forbidden()', async () => {
    mockGetSession.mockResolvedValue(SESSION_CLIENTE as Parameters<typeof mockGetSession.mockResolvedValue>[0]);
    await expect(requireOwnership('e1')).rejects.toThrow('FORBIDDEN');
    expect(mockForbidden).toHaveBeenCalledOnce();
  });

  it('RO6 llama unauthorized() cuando no hay sesión', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(requireOwnership('e1')).rejects.toThrow('UNAUTHORIZED');
    expect(mockUnauthorized).toHaveBeenCalledOnce();
  });
});
