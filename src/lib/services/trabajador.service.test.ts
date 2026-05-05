import { describe, it, expect } from 'vitest';
import { CrearTrabajadorSchema, ActualizarTrabajadorSchema, ListarTrabajadoresSchema } from '@/lib/validations/trabajador';
import { CrearHijoSchema } from '@/lib/validations/hijo';

const baseT = {
  empresaId: 'emp-test-id',
  dni: '12345678',
  apellidoPaterno: 'García',
  apellidoMaterno: 'López',
  nombres: 'Juan',
  fechaNacimiento: new Date('1990-06-15'),
  sexo: 'M' as const,
};

describe('CrearTrabajadorSchema', () => {
  it('acepta input mínimo válido', () => {
    const r = CrearTrabajadorSchema.parse(baseT);
    expect(r.dni).toBe('12345678');
    expect(r.sexo).toBe('M');
  });

  it('rechaza DNI con menos de 8 dígitos', () => {
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, dni: '1234567' })).toThrow();
  });

  it('rechaza DNI con más de 8 dígitos', () => {
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, dni: '123456789' })).toThrow();
  });

  it('rechaza DNI con letras', () => {
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, dni: '1234567A' })).toThrow();
  });

  it('rechaza sexo distinto de M/F', () => {
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, sexo: 'X' })).toThrow();
  });

  it('acepta sexo F', () => {
    const r = CrearTrabajadorSchema.parse({ ...baseT, sexo: 'F' });
    expect(r.sexo).toBe('F');
  });

  it('rechaza fechaNacimiento futura', () => {
    const maniana = new Date();
    maniana.setDate(maniana.getDate() + 1);
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, fechaNacimiento: maniana })).toThrow();
  });

  it('rechaza fechaNacimiento mayor a 120 años', () => {
    const antiguo = new Date();
    antiguo.setFullYear(antiguo.getFullYear() - 121);
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, fechaNacimiento: antiguo })).toThrow();
  });

  it('rechaza email inválido', () => {
    expect(() => CrearTrabajadorSchema.parse({ ...baseT, email: 'noemail' })).toThrow();
  });

  it('acepta campos opcionales', () => {
    const r = CrearTrabajadorSchema.parse({ ...baseT, email: 'juan@test.pe', direccion: 'Av. Test 1' });
    expect(r.email).toBe('juan@test.pe');
  });
});

describe('ActualizarTrabajadorSchema', () => {
  it('acepta objeto vacío sin defaults', () => {
    expect(ActualizarTrabajadorSchema.parse({})).toEqual({});
  });

  it('rechaza DNI inválido en actualización', () => {
    expect(() => ActualizarTrabajadorSchema.parse({ dni: '1234' })).toThrow();
  });

  it('rechaza sexo inválido en actualización', () => {
    expect(() => ActualizarTrabajadorSchema.parse({ sexo: 'O' })).toThrow();
  });
});

describe('ListarTrabajadoresSchema', () => {
  it('aplica defaults', () => {
    const r = ListarTrabajadoresSchema.parse({});
    expect(r.incluirEliminados).toBe(false);
    expect(r.pagina).toBe(1);
    expect(r.porPagina).toBe(20);
  });

  it('rechaza porPagina > 100', () => {
    expect(() => ListarTrabajadoresSchema.parse({ porPagina: 101 })).toThrow();
  });
});

const baseH = {
  nombres: 'Ana García',
  fechaNacimiento: new Date('2010-03-20'),
};

describe('CrearHijoSchema', () => {
  it('acepta input mínimo válido', () => {
    const r = CrearHijoSchema.parse(baseH);
    expect(r.nombres).toBe('Ana García');
    expect(r.dni).toBeUndefined();
  });

  it('rechaza fechaNacimiento futura', () => {
    const maniana = new Date();
    maniana.setDate(maniana.getDate() + 1);
    expect(() => CrearHijoSchema.parse({ ...baseH, fechaNacimiento: maniana })).toThrow();
  });

  it('rechaza fechaNacimiento mayor a 100 años', () => {
    const antiguo = new Date();
    antiguo.setFullYear(antiguo.getFullYear() - 101);
    expect(() => CrearHijoSchema.parse({ ...baseH, fechaNacimiento: antiguo })).toThrow();
  });

  it('rechaza DNI hijo con letras', () => {
    expect(() => CrearHijoSchema.parse({ ...baseH, dni: '1234567X' })).toThrow();
  });

  it('rechaza DNI hijo con <8 dígitos', () => {
    expect(() => CrearHijoSchema.parse({ ...baseH, dni: '1234567' })).toThrow();
  });

  it('acepta DNI hijo de 8 dígitos', () => {
    const r = CrearHijoSchema.parse({ ...baseH, dni: '87654321' });
    expect(r.dni).toBe('87654321');
  });
});
