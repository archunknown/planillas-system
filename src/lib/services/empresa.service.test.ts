// Tests unitarios de los schemas Zod de empresa (código puro, sin Prisma)
import { describe, it, expect } from 'vitest';
import { CrearEmpresaSchema, ActualizarEmpresaSchema, ListarEmpresasSchema } from '@/lib/validations/empresa';

const baseValida = {
  ruc: '20100454523',
  razonSocial: 'Empresa Test SAC',
  tipoEmpresa: 'SAC' as const,
  direccion: 'Av. Test 123',
  distrito: 'Lima',
  provincia: 'Lima',
  departamento: 'Lima',
};

describe('CrearEmpresaSchema', () => {
  it('acepta input mínimo válido', () => {
    const result = CrearEmpresaSchema.parse(baseValida);
    expect(result.ruc).toBe('20100454523');
    expect(result.activa).toBe(true);
  });

  it('aplica default activa=true', () => {
    const result = CrearEmpresaSchema.parse(baseValida);
    expect(result.activa).toBe(true);
  });

  it('acepta campos opcionales', () => {
    const result = CrearEmpresaSchema.parse({
      ...baseValida,
      nombreComercial: 'ET',
      telefono: '01-1234567',
      email: 'test@empresa.pe',
      activa: false,
    });
    expect(result.nombreComercial).toBe('ET');
    expect(result.email).toBe('test@empresa.pe');
    expect(result.activa).toBe(false);
  });

  it('rechaza RUC con menos de 11 dígitos', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, ruc: '201' })).toThrow();
  });

  it('rechaza RUC con más de 11 dígitos', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, ruc: '201004545231' })).toThrow();
  });

  it('rechaza RUC con letras', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, ruc: '2010045452A' })).toThrow();
  });

  it('rechaza email inválido', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, email: 'no-es-email' })).toThrow();
  });

  it('rechaza tipoEmpresa inválido', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, tipoEmpresa: 'LLC' })).toThrow();
  });

  it('rechaza razonSocial vacía', () => {
    expect(() => CrearEmpresaSchema.parse({ ...baseValida, razonSocial: '' })).toThrow();
  });
});

describe('ActualizarEmpresaSchema', () => {
  it('acepta objeto vacío (todos opcionales)', () => {
    const result = ActualizarEmpresaSchema.parse({});
    expect(result).toEqual({});
  });

  it('acepta actualización parcial válida', () => {
    const result = ActualizarEmpresaSchema.parse({ razonSocial: 'Nuevo Nombre SAC' });
    expect(result.razonSocial).toBe('Nuevo Nombre SAC');
  });

  it('rechaza email inválido en actualización', () => {
    expect(() => ActualizarEmpresaSchema.parse({ email: 'malemail' })).toThrow();
  });
});

describe('ListarEmpresasSchema', () => {
  it('aplica defaults con objeto vacío', () => {
    const result = ListarEmpresasSchema.parse({});
    expect(result.incluirEliminados).toBe(false);
    expect(result.pagina).toBe(1);
    expect(result.porPagina).toBe(20);
    expect(result.soloActivas).toBeUndefined();
  });

  it('acepta incluirEliminados=true', () => {
    const result = ListarEmpresasSchema.parse({ incluirEliminados: true });
    expect(result.incluirEliminados).toBe(true);
  });

  it('rechaza porPagina mayor a 100', () => {
    expect(() => ListarEmpresasSchema.parse({ porPagina: 101 })).toThrow();
  });

  it('rechaza pagina menor a 1', () => {
    expect(() => ListarEmpresasSchema.parse({ pagina: 0 })).toThrow();
  });
});
