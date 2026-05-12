import { describe, it, expect } from 'vitest';
import {
  AbrirPeriodoSchema,
  ActualizarInputsDetalleSchema,
  ListarPeriodosSchema,
} from '@/lib/validations/periodo';

const empresaIdValido = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('AbrirPeriodoSchema', () => {
  it('PSU1 acepta input válido', () => {
    const result = AbrirPeriodoSchema.parse({ empresaId: empresaIdValido, anio: 2026, mes: 5 });
    expect(result.mes).toBe(5);
    expect(result.anio).toBe(2026);
  });

  it('PSU2 rechaza mes 0', () => {
    expect(() => AbrirPeriodoSchema.parse({ empresaId: empresaIdValido, anio: 2026, mes: 0 })).toThrow();
  });

  it('PSU3 rechaza mes 13', () => {
    expect(() => AbrirPeriodoSchema.parse({ empresaId: empresaIdValido, anio: 2026, mes: 13 })).toThrow();
  });

  it('PSU4 rechaza anio anterior a 2020', () => {
    expect(() => AbrirPeriodoSchema.parse({ empresaId: empresaIdValido, anio: 2019, mes: 1 })).toThrow();
  });

  it('PSU5 rechaza anio posterior a 2100', () => {
    expect(() => AbrirPeriodoSchema.parse({ empresaId: empresaIdValido, anio: 2101, mes: 1 })).toThrow();
  });

  it('PSU6 rechaza empresaId que no es cuid', () => {
    expect(() => AbrirPeriodoSchema.parse({ empresaId: 'no-es-cuid', anio: 2026, mes: 1 })).toThrow();
  });
});

describe('ActualizarInputsDetalleSchema', () => {
  it('PSU7 acepta objeto vacío (todos opcionales)', () => {
    const result = ActualizarInputsDetalleSchema.parse({});
    expect(result).toEqual({});
  });

  it('PSU8 acepta minutosAtraso = 2000 (límite superior)', () => {
    const result = ActualizarInputsDetalleSchema.parse({ minutosAtraso: 2000 });
    expect(result.minutosAtraso).toBe(2000);
  });

  it('PSU9 rechaza minutosAtraso > 2000', () => {
    expect(() => ActualizarInputsDetalleSchema.parse({ minutosAtraso: 2001 })).toThrow();
  });

  it('PSU10 rechaza diasTrabajados > 31', () => {
    expect(() => ActualizarInputsDetalleSchema.parse({ diasTrabajados: 32 })).toThrow();
  });

  it('PSU11 rechaza diasTrabajados negativo', () => {
    expect(() => ActualizarInputsDetalleSchema.parse({ diasTrabajados: -1 })).toThrow();
  });

  it('PSU12 acepta horasExtras25 = 200 (límite superior)', () => {
    const result = ActualizarInputsDetalleSchema.parse({ horasExtras25: 200 });
    expect(result.horasExtras25).toBe(200);
  });

  it('PSU13 rechaza horasExtras35 > 200', () => {
    expect(() => ActualizarInputsDetalleSchema.parse({ horasExtras35: 200.01 })).toThrow();
  });
});

describe('ListarPeriodosSchema', () => {
  it('PSU14 aplica defaults pagina=1, porPagina=12', () => {
    const result = ListarPeriodosSchema.parse({ empresaId: empresaIdValido });
    expect(result.pagina).toBe(1);
    expect(result.porPagina).toBe(12);
  });

  it('PSU15 acepta filtros opcionales anio y estado', () => {
    const result = ListarPeriodosSchema.parse({
      empresaId: empresaIdValido,
      anio: 2026,
      estado: 'CERRADO',
    });
    expect(result.anio).toBe(2026);
    expect(result.estado).toBe('CERRADO');
  });

  it('PSU16 rechaza estado inválido', () => {
    expect(() =>
      ListarPeriodosSchema.parse({ empresaId: empresaIdValido, estado: 'PENDIENTE' }),
    ).toThrow();
  });

  it('PSU17 rechaza porPagina > 100', () => {
    expect(() =>
      ListarPeriodosSchema.parse({ empresaId: empresaIdValido, porPagina: 101 }),
    ).toThrow();
  });
});
