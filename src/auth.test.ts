import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — factory must not reference outer const variables
vi.mock('@/lib/services/usuario.service', () => ({
  obtenerCredencialPorEmail: vi.fn(),
  verificarContrasena: vi.fn(),
}));
vi.mock('next-auth', () => ({
  default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock('next-auth/providers/credentials', () => ({
  default: (config: unknown) => config,
}));

import { obtenerCredencialPorEmail, verificarContrasena } from '@/lib/services/usuario.service';
import { authorizeCredentials, embedUserInToken } from './auth';
import type { AuthPayload } from './auth';

const mockObtenerCredencial = vi.mocked(obtenerCredencialPorEmail);
const mockVerificarContrasena = vi.mocked(verificarContrasena);

const MOCK_CRED = {
  id: 'u1',
  email: 'admin@test.pe',
  nombre: 'Admin',
  apellidos: 'Test',
  password: '$argon2id$v=19$...',
  rol: 'ADMIN' as const,
  activo: true,
  empresasIds: ['e1', 'e2'],
};

// ──────────────────────────────────────────────────────────────────────
// authorizeCredentials
// ──────────────────────────────────────────────────────────────────────
describe('authorizeCredentials', () => {
  beforeEach(() => vi.clearAllMocks());

  it('A1 retorna user payload con credenciales válidas', async () => {
    mockObtenerCredencial.mockResolvedValue(MOCK_CRED);
    mockVerificarContrasena.mockResolvedValue(true);
    const result = await authorizeCredentials({ email: 'admin@test.pe', password: 'Segura123!' });
    expect(result).toMatchObject({
      id: 'u1',
      email: 'admin@test.pe',
      name: 'Admin Test',
      rol: 'ADMIN',
      empresasIds: ['e1', 'e2'],
    });
  });

  it('A2 retorna null si el email no existe', async () => {
    mockObtenerCredencial.mockResolvedValue(null);
    expect(await authorizeCredentials({ email: 'noexiste@test.pe', password: 'x' })).toBeNull();
  });

  it('A3 retorna null si la contraseña es incorrecta', async () => {
    mockObtenerCredencial.mockResolvedValue(MOCK_CRED);
    mockVerificarContrasena.mockResolvedValue(false);
    expect(await authorizeCredentials({ email: 'admin@test.pe', password: 'mala' })).toBeNull();
  });

  it('A4 retorna null si el usuario está inactivo', async () => {
    mockObtenerCredencial.mockResolvedValue({ ...MOCK_CRED, activo: false });
    mockVerificarContrasena.mockResolvedValue(true);
    expect(await authorizeCredentials({ email: 'admin@test.pe', password: 'Segura123!' })).toBeNull();
  });

  it('A5 normaliza email a minúsculas antes del lookup', async () => {
    mockObtenerCredencial.mockResolvedValue(null);
    await authorizeCredentials({ email: 'ADMIN@TEST.PE', password: 'x' });
    expect(mockObtenerCredencial).toHaveBeenCalledWith('admin@test.pe');
  });

  it('A6 retorna null si el email es inválido (no llega al DB)', async () => {
    expect(await authorizeCredentials({ email: 'no-es-email', password: 'Segura123!' })).toBeNull();
    expect(mockObtenerCredencial).not.toHaveBeenCalled();
  });

  it('A7 retorna null si la contraseña está vacía (no llega al DB)', async () => {
    expect(await authorizeCredentials({ email: 'admin@test.pe', password: '' })).toBeNull();
    expect(mockObtenerCredencial).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────
// embedUserInToken (jwt callback utility)
// ──────────────────────────────────────────────────────────────────────
describe('embedUserInToken', () => {
  const BASE_TOKEN = { name: 'Admin Test', email: 'admin@test.pe', sub: 'u1', iat: 12345 };
  const USER: AuthPayload = {
    id: 'u1',
    email: 'admin@test.pe',
    name: 'Admin Test',
    rol: 'ADMIN',
    empresasIds: ['e1'],
  };

  it('J1 embebe rol y empresasIds en el token', () => {
    const result = embedUserInToken(BASE_TOKEN, USER);
    expect(result).toMatchObject({ rol: 'ADMIN', empresasIds: ['e1'] });
  });

  it('J2 preserva los campos previos del token', () => {
    const result = embedUserInToken(BASE_TOKEN, USER);
    expect(result.iat).toBe(12345);
    expect(result.sub).toBe('u1');
  });

  it('J3 ADMIN con empresasIds vacío preserva el array vacío', () => {
    const result = embedUserInToken(BASE_TOKEN, { ...USER, empresasIds: [] });
    expect(result.empresasIds).toEqual([]);
  });
});
