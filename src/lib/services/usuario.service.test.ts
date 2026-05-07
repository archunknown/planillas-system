import { describe, it, expect } from 'vitest';
import { CrearUsuarioSchema, LoginSchema } from '@/lib/validations/usuario';

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
