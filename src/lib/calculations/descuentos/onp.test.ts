import { describe, it, expect } from 'vitest';
import { calcularDescuentoOnp } from './onp';

describe('calcularDescuentoOnp', () => {
  it('calcula descuento ONP sobre remuneración de S/1500 (13%)', () => {
    expect(calcularDescuentoOnp(1500)).toBeCloseTo(195.00, 2);
  });

  it('calcula descuento ONP sobre remuneración de S/930', () => {
    expect(calcularDescuentoOnp(930)).toBeCloseTo(120.90, 2);
  });

  it('retorna cero cuando la remuneración es cero', () => {
    expect(calcularDescuentoOnp(0)).toBeCloseTo(0.00, 2);
  });

  it('redondea correctamente a 2 decimales sobre S/2500.50', () => {
    expect(calcularDescuentoOnp(2500.50)).toBeCloseTo(325.07, 2);
  });
});
