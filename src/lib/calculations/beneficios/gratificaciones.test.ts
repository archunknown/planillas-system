import { describe, it, expect } from 'vitest';
import { calcularGratificacion } from './gratificaciones';

// NOTA: la función no tiene diasComputables — solo calcula meses enteros.
// El caso "3 meses, 15 días" del spec es omitido y reemplazado por "3 meses completos".

describe('calcularGratificacion - régimen general, tasa EsSalud 9%', () => {
  it('calcula gratificación completa por 6 meses trabajados con tasa EsSalud 9%', () => {
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 6,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(1500.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(135.00, 2);
    expect(result.total).toBeCloseTo(1635.00, 2);
  });

  it('calcula gratificación proporcional por 3 meses completos con tasa EsSalud 9%', () => {
    // (1500/6)*3 = 750. bonif = 750*0.09 = 67.50. total = 817.50.
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 3,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(750.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(67.50, 2);
    expect(result.total).toBeCloseTo(817.50, 2);
  });

  it('retorna cero cuando no hay meses computables', () => {
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 0,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(0.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(0.00, 2);
    expect(result.total).toBeCloseTo(0.00, 2);
  });
});

describe('calcularGratificacion - tasa EPS 6.75%', () => {
  it('calcula gratificación S/2000 por 6 meses con tasa EPS 6.75%', () => {
    // gratif = 2000.00. bonif = 2000*0.0675 = 135.00. total = 2135.00.
    const result = calcularGratificacion({
      remuneracionBase: 2000,
      asignacionFamiliar: 0,
      mesesComputables: 6,
      tasaEssalud: 0.0675,
    });
    expect(result.gratificacionBase).toBeCloseTo(2000.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(135.00, 2);
    expect(result.total).toBeCloseTo(2135.00, 2);
  });
});

describe('calcularGratificacion - diasComputables (D.S. 017-2002-TR art. 3.4)', () => {
  it('3 meses + 15 días: (1500/6)×3 + (1500/180)×15 = 875. Bonif: 78.75', () => {
    // D.S. 017-2002-TR — proporcionalidad por días a razón de 1/30 del mes (180 = 6×30)
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 3,
      diasComputables: 15,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(875.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(78.75, 2);
    expect(result.total).toBeCloseTo(953.75, 2);
  });

  it('0 meses, 15 días: solo fracción de mes. gratif = 125. Bonif: 11.25', () => {
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 0,
      diasComputables: 15,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(125.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(11.25, 2);
    expect(result.total).toBeCloseTo(136.25, 2);
  });

  it('5 meses + 29 días: 1250 + 241.67 = 1491.67. Bonif: 134.25', () => {
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 5,
      diasComputables: 29,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(1491.67, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(134.25, 2);
    expect(result.total).toBeCloseTo(1625.92, 2);
  });

  it('backward compat: sin diasComputables el resultado es idéntico al cálculo solo por meses', () => {
    // diasComputables ausente → default 0 → mismo resultado que antes del cambio
    const result = calcularGratificacion({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 6,
      tasaEssalud: 0.09,
    });
    expect(result.gratificacionBase).toBeCloseTo(1500.00, 2);
    expect(result.bonificacionExtraordinaria).toBeCloseTo(135.00, 2);
    expect(result.total).toBeCloseTo(1635.00, 2);
  });
});
