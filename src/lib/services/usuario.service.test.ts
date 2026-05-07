import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearUsuarioSchema, LoginSchema } from '@/lib/validations/usuario';

// ──────────────────────────────────────────────────────────────────────
// buscarPorEmail — no expone password
// ──────────────────────────────────────────────────────────────────────
const mockFindUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { usuario: { findUnique: mockFindUnique } },
}));

describe('buscarPorEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('BP1 retorna null si no existe el usuario', async () => {
    mockFindUnique.mockResolvedValue(null);
    const { buscarPorEmail } = await import('./usuario.service');
    expect(await buscarPorEmail('noexiste@test.pe')).toBeNull();
  });

  it('BP2 no incluye el campo password en el retorno', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'admin@test.pe',
      nombre: 'Admin',
      apellidos: 'Test',
      password: '$argon2id$...',
      rol: 'ADMIN',
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });
    const { buscarPorEmail } = await import('./usuario.service');
    const result = await buscarPorEmail('admin@test.pe');
    expect(result).not.toBeNull();
    expect(result).not.toMatchObject({ password: expect.anything() });
  });

  it('BP3 normaliza email a minúsculas en el lookup', async () => {
    mockFindUnique.mockResolvedValue(null);
    const { buscarPorEmail } = await import('./usuario.service');
    await buscarPorEmail('ADMIN@TEST.PE');
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'admin@test.pe' } });
  });
});

// ──────────────────────────────────────────────────────────────────────
// CrearUsuarioSchema
// ──────────────────────────────────────────────────────────────────────
describe('CrearUsuarioSchema', () => {
  const BASE = {
    email: 'admin@estudio.pe',
    nombre: 'Admin',
    apellidos: 'Principal',
    password: 'Segura123!',
    rol: 'ADMIN' as const,
  };

  it('U1 acepta input válido completo', () => {
    expect(() => CrearUsuarioSchema.parse(BASE)).not.toThrow();
  });

  it('U2 rechaza email inválido', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, email: 'no-es-email' })).toThrow();
  });

  it('U3 rechaza email vacío', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, email: '' })).toThrow();
  });

  it('U4 rechaza password menor a 8 caracteres', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, password: 'corto' })).toThrow();
  });

  it('U5 rechaza password mayor a 72 caracteres', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, password: 'x'.repeat(73) })).toThrow();
  });

  it('U6 rechaza nombre vacío', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, nombre: '' })).toThrow();
  });

  it('U7 rechaza apellidos vacío', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, apellidos: '' })).toThrow();
  });

  it('U8 rechaza rol inválido', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, rol: 'SUPERADMIN' })).toThrow();
  });

  it('U9 acepta rol CONTADOR', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, rol: 'CONTADOR' })).not.toThrow();
  });

  it('U10 acepta rol CLIENTE', () => {
    expect(() => CrearUsuarioSchema.parse({ ...BASE, rol: 'CLIENTE' })).not.toThrow();
  });

  it('U11 normaliza: parse devuelve objeto con todos los campos', () => {
    const result = CrearUsuarioSchema.parse(BASE);
    expect(result).toMatchObject({ email: 'admin@estudio.pe', rol: 'ADMIN' });
  });
});

// ──────────────────────────────────────────────────────────────────────
// LoginSchema
// ──────────────────────────────────────────────────────────────────────
describe('LoginSchema', () => {
  const BASE = { email: 'admin@estudio.pe', password: 'cualquiera' };

  it('L1 acepta credenciales válidas', () => {
    expect(() => LoginSchema.parse(BASE)).not.toThrow();
  });

  it('L2 rechaza email inválido', () => {
    expect(() => LoginSchema.parse({ ...BASE, email: 'malformado' })).toThrow();
  });

  it('L3 rechaza password vacío', () => {
    expect(() => LoginSchema.parse({ ...BASE, password: '' })).toThrow();
  });

  it('L4 acepta password corto (solo valida no vacío en login)', () => {
    expect(() => LoginSchema.parse({ ...BASE, password: 'x' })).not.toThrow();
  });
});
