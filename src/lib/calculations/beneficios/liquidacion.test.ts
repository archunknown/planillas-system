import { describe, it, expect } from 'vitest';
import { calcularLiquidacion } from './liquidacion';

// calcularLiquidacion es un sumador puro — recibe montos precalculados.
// La bonificación extraordinaria de la gratificación debe incluirse en gratificacionTrunca.
// remuneracionPendiente se pasa como 0 en todos los casos de prueba.

describe('calcularLiquidacion - caso base sin descuentos', () => {
  it('suma CTS trunca + gratificación trunca (con bonificación) + vacaciones truncas sin descuentos', () => {
    // CTS: 750 | Gratif trunca: 750 + bonif 67.50 = 817.50 | Vacaciones: 750
    // totalBruto = 750 + 817.50 + 750 = 2317.50
    const result = calcularLiquidacion({
      ctsTrunca: 750,
      gratificacionTrunca: 817.50,
      vacacionesTruncas: 750,
      remuneracionPendiente: 0,
      descuentos: 0,
    });
    expect(result.totalBruto).toBeCloseTo(2317.50, 2);
    expect(result.descuentos).toBeCloseTo(0.00, 2);
    expect(result.totalNeto).toBeCloseTo(2317.50, 2);
  });
});

describe('calcularLiquidacion - con descuentos', () => {
  it('aplica descuento ONP y calcula neto correctamente', () => {
    // Mismos montos + descuento ONP S/195
    const result = calcularLiquidacion({
      ctsTrunca: 750,
      gratificacionTrunca: 817.50,
      vacacionesTruncas: 750,
      remuneracionPendiente: 0,
      descuentos: 195,
    });
    expect(result.totalBruto).toBeCloseTo(2317.50, 2);
    expect(result.descuentos).toBeCloseTo(195.00, 2);
    expect(result.totalNeto).toBeCloseTo(2122.50, 2);
  });
});

describe('calcularLiquidacion - casos extremos', () => {
  it('retorna cero en todos los campos cuando todos los ingresos son cero', () => {
    const result = calcularLiquidacion({
      ctsTrunca: 0,
      gratificacionTrunca: 0,
      vacacionesTruncas: 0,
      remuneracionPendiente: 0,
      descuentos: 0,
    });
    expect(result.totalBruto).toBeCloseTo(0.00, 2);
    expect(result.totalNeto).toBeCloseTo(0.00, 2);
  });

  it('protege contra neto negativo cuando los descuentos superan el bruto', () => {
    const result = calcularLiquidacion({
      ctsTrunca: 100,
      gratificacionTrunca: 0,
      vacacionesTruncas: 0,
      remuneracionPendiente: 0,
      descuentos: 500,
    });
    expect(result.totalBruto).toBeCloseTo(100.00, 2);
    expect(result.totalNeto).toBeCloseTo(0.00, 2);
  });
});
