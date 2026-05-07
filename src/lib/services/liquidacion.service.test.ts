import { describe, it, expect } from 'vitest';
import {
  CalcularLiquidacionSchema,
  AnularLiquidacionSchema,
  ListarLiquidacionesSchema,
} from '@/lib/validations/liquidacion';

describe('CalcularLiquidacionSchema', () => {
  it('acepta contratoId y fechaCese válidos', () => {
    const r = CalcularLiquidacionSchema.parse({
      contratoId: 'cid-test',
      fechaCese: new Date(),
    });
    expect(r.contratoId).toBe('cid-test');
    expect(r.fechaCese).toBeInstanceOf(Date);
  });

  it('rechaza contratoId vacío', () => {
    expect(() =>
      CalcularLiquidacionSchema.parse({ contratoId: '', fechaCese: new Date() }),
    ).toThrow();
  });

  it('rechaza fechaCese más de 1 año en el futuro', () => {
    const masDeUnAnio = new Date();
    masDeUnAnio.setFullYear(masDeUnAnio.getFullYear() + 2);
    expect(() =>
      CalcularLiquidacionSchema.parse({ contratoId: 'cid', fechaCese: masDeUnAnio }),
    ).toThrow();
  });

  it('acepta fechaCese en el pasado (fecha histórica)', () => {
    const hace5Anios = new Date();
    hace5Anios.setFullYear(hace5Anios.getFullYear() - 5);
    const r = CalcularLiquidacionSchema.parse({ contratoId: 'cid', fechaCese: hace5Anios });
    expect(r.fechaCese).toBeInstanceOf(Date);
  });

  it('coerce: acepta fechaCese como string ISO', () => {
    const r = CalcularLiquidacionSchema.parse({
      contratoId: 'cid',
      fechaCese: '2026-01-15',
    });
    expect(r.fechaCese).toBeInstanceOf(Date);
  });
});

describe('AnularLiquidacionSchema', () => {
  it('acepta motivoAnulacion entre 5 y 300 caracteres', () => {
    const r = AnularLiquidacionSchema.parse({ motivoAnulacion: 'Error de cálculo detectado en auditoría.' });
    expect(r.motivoAnulacion).toBe('Error de cálculo detectado en auditoría.');
  });

  it('rechaza motivoAnulacion con menos de 5 caracteres', () => {
    expect(() => AnularLiquidacionSchema.parse({ motivoAnulacion: 'cor' })).toThrow();
  });

  it('rechaza motivoAnulacion con más de 300 caracteres', () => {
    expect(() =>
      AnularLiquidacionSchema.parse({ motivoAnulacion: 'x'.repeat(301) }),
    ).toThrow();
  });

  it('rechaza motivoAnulacion vacío', () => {
    expect(() => AnularLiquidacionSchema.parse({ motivoAnulacion: '' })).toThrow();
  });
});

describe('ListarLiquidacionesSchema', () => {
  it('tiene defaults: incluirAnuladas=false, pagina=1, porPagina=20', () => {
    const r = ListarLiquidacionesSchema.parse({});
    expect(r.incluirAnuladas).toBe(false);
    expect(r.pagina).toBe(1);
    expect(r.porPagina).toBe(20);
  });

  it('acepta fechaCeseDesde y fechaCeseHasta como strings ISO', () => {
    const r = ListarLiquidacionesSchema.parse({
      fechaCeseDesde: '2026-01-01',
      fechaCeseHasta: '2026-12-31',
    });
    expect(r.fechaCeseDesde).toBeInstanceOf(Date);
    expect(r.fechaCeseHasta).toBeInstanceOf(Date);
  });

  it('rechaza porPagina > 100', () => {
    expect(() => ListarLiquidacionesSchema.parse({ porPagina: 101 })).toThrow();
  });

  it('rechaza pagina = 0', () => {
    expect(() => ListarLiquidacionesSchema.parse({ pagina: 0 })).toThrow();
  });

  it('acepta incluirAnuladas=true', () => {
    const r = ListarLiquidacionesSchema.parse({ incluirAnuladas: true });
    expect(r.incluirAnuladas).toBe(true);
  });
});
