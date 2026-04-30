import { describe, it, expect } from 'vitest';
import { calcularCts, calcularCtsPequenaEmpresa } from './cts';

// Helpers para construir inputs sin asignación familiar, horas extras ni gratificación
const inputSimple = (
  remuneracionBase: number,
  mesesComputablesCompletos: number,
  diasComputablesRestantes: number
) => ({
  remuneracionBase,
  asignacionFamiliar: 0,
  promedioHorasExtras6Meses: 0,
  sextoGratificacion: 0,
  mesesComputablesCompletos,
  diasComputablesRestantes,
});

describe('calcularCts - remuneración computable simple (sin AF, HE ni gratificación)', () => {
  it('calcula CTS depósito sobre 6 meses completos sin días adicionales', () => {
    const result = calcularCts(inputSimple(1500, 6, 0));
    expect(result.remuneracionComputable).toBeCloseTo(1500, 2);
    expect(result.montoPorMeses).toBeCloseTo(750.00, 2);
    expect(result.montoPorDias).toBeCloseTo(0.00, 2);
    expect(result.total).toBeCloseTo(750.00, 2);
  });

  it('calcula CTS depósito sobre 3 meses completos más 15 días adicionales', () => {
    const result = calcularCts(inputSimple(1500, 3, 15));
    expect(result.remuneracionComputable).toBeCloseTo(1500, 2);
    expect(result.montoPorMeses).toBeCloseTo(375.00, 2);
    expect(result.montoPorDias).toBeCloseTo(62.50, 2);
    expect(result.total).toBeCloseTo(437.50, 2);
  });

  it('retorna cero cuando no hay meses ni días computables', () => {
    const result = calcularCts(inputSimple(1500, 0, 0));
    expect(result.total).toBeCloseTo(0.00, 2);
  });

  it('calcula CTS depósito sobre 6 meses completos más 30 días adicionales', () => {
    const result = calcularCts(inputSimple(1500, 6, 30));
    expect(result.montoPorMeses).toBeCloseTo(750.00, 2);
    expect(result.montoPorDias).toBeCloseTo(125.00, 2);
    expect(result.total).toBeCloseTo(875.00, 2);
  });
});

describe('calcularCtsPequenaEmpresa - D.S. 013-2013-PRODUCE art. 42', () => {
  it('calcula CTS pequeña empresa para año completo — equivale a una remuneración mensual', () => {
    // remComputable=1500, remDiaria=50, ctsAnual=750, (750/12)×12=750
    expect(calcularCtsPequenaEmpresa(inputSimple(1500, 12, 0))).toBeCloseTo(750.00, 2);
  });

  it('calcula CTS pequeña empresa para 6 meses completos', () => {
    // (750/12)×6 = 375
    expect(calcularCtsPequenaEmpresa(inputSimple(1500, 6, 0))).toBeCloseTo(375.00, 2);
  });

  it('calcula CTS pequeña empresa para 3 meses + 15 días', () => {
    // ctsAnual=750. (750/12)×3 + (750/360)×15 = 187.50 + 31.25 = 218.75
    expect(calcularCtsPequenaEmpresa(inputSimple(1500, 3, 15))).toBeCloseTo(218.75, 2);
  });

  it('retorna cero cuando no hay meses ni días computables', () => {
    expect(calcularCtsPequenaEmpresa(inputSimple(1500, 0, 0))).toBeCloseTo(0.00, 2);
  });

  it('incorpora asignación familiar y sexto de gratificación en la base', () => {
    // remComputable = 1500+113+0+250 = 1863, remDiaria=62.10, ctsAnual=931.50
    expect(calcularCtsPequenaEmpresa({
      remuneracionBase: 1500,
      asignacionFamiliar: 113,
      promedioHorasExtras6Meses: 0,
      sextoGratificacion: 250,
      mesesComputablesCompletos: 12,
      diasComputablesRestantes: 0,
    })).toBeCloseTo(931.50, 2);
  });
});

describe('calcularCts - remuneración computable con sexto de gratificación', () => {
  it('incorpora el sexto de gratificación en la remuneración computable', () => {
    // Base 1500 + sextoGratificacion 250 (= 1500/6) → remuneracionComputable 1750
    // 6 meses → (1750/12)*6 = 875.00
    const result = calcularCts({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      promedioHorasExtras6Meses: 0,
      sextoGratificacion: 250,
      mesesComputablesCompletos: 6,
      diasComputablesRestantes: 0,
    });
    expect(result.remuneracionComputable).toBeCloseTo(1750.00, 2);
    expect(result.total).toBeCloseTo(875.00, 2);
  });
});
