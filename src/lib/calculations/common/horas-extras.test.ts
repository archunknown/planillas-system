import { describe, it, expect } from 'vitest';
import { calcularHorasExtras, clasificarHorasExtras } from './horas-extras';

describe('calcularHorasExtras', () => {
  it('calcula monto de 2 horas extras al 25%', () => {
    const result = calcularHorasExtras(6.25, 2, 0, 0);
    expect(result.monto25).toBeCloseTo(15.63, 2);
  });

  it('calcula monto de 2 horas extras al 35%', () => {
    const result = calcularHorasExtras(6.25, 0, 2, 0);
    expect(result.monto35).toBeCloseTo(16.88, 2);
  });

  it('calcula monto de 2 horas extras al 100%', () => {
    const result = calcularHorasExtras(6.25, 0, 0, 2);
    expect(result.monto100).toBeCloseTo(25.00, 2);
  });

  it('retorna cero cuando no hay horas extras al 25%', () => {
    const result = calcularHorasExtras(6.25, 0, 0, 0);
    expect(result.monto25).toBeCloseTo(0.00, 2);
  });
});

describe('clasificarHorasExtras - D.S. 007-2002-TR art. 10', () => {
  it('retorna cero en ambos tipos cuando no hay horas extras', () => {
    expect(clasificarHorasExtras(0)).toEqual({ horas25: 0, horas35: 0 });
  });

  it('1 hora entra totalmente en el tramo 25%', () => {
    expect(clasificarHorasExtras(1)).toEqual({ horas25: 1, horas35: 0 });
  });

  it('2 horas llenan exactamente el umbral 25%', () => {
    expect(clasificarHorasExtras(2)).toEqual({ horas25: 2, horas35: 0 });
  });

  it('3 horas: 2 al 25% + 1 al 35%', () => {
    expect(clasificarHorasExtras(3)).toEqual({ horas25: 2, horas35: 1 });
  });

  it('5 horas: 2 al 25% + 3 al 35%', () => {
    expect(clasificarHorasExtras(5)).toEqual({ horas25: 2, horas35: 3 });
  });

  it('10 horas: 2 al 25% + 8 al 35%', () => {
    expect(clasificarHorasExtras(10)).toEqual({ horas25: 2, horas35: 8 });
  });

  it('umbral personalizado de 3: 5 horas → 3 al 25% + 2 al 35%', () => {
    expect(clasificarHorasExtras(5, 3)).toEqual({ horas25: 3, horas35: 2 });
  });
});
