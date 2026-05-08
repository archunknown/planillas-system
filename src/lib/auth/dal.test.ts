import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: unknown) => fn };
});
vi.mock('@/auth', () => ({ auth: vi.fn() }));

import { auth } from '@/auth';
import { getSession } from './dal';

const mockAuth = vi.mocked(auth);

describe('getSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('D1 retorna null cuando no hay sesión activa', async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getSession()).toBeNull();
  });

  it('D2 retorna la sesión cuando el usuario está autenticado', async () => {
    const mockSession = {
      user: { id: 'u1', email: 'admin@test.pe', name: 'Admin', rol: 'ADMIN', empresasIds: [] },
      expires: '2026-06-01T00:00:00.000Z',
    };
    mockAuth.mockResolvedValue(mockSession as Parameters<typeof mockAuth.mockResolvedValue>[0]);
    expect(await getSession()).toEqual(mockSession);
  });

  it('D3 delega directamente a auth() de next-auth', async () => {
    mockAuth.mockResolvedValue(null);
    await getSession();
    expect(mockAuth).toHaveBeenCalledOnce();
  });
});
