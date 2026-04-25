import { describe, it, expect } from 'vitest';
import { calcularDescuentoAfp } from './afp';

// Tasas reales por AFP (fuente SBS). primaSeguro sin tope RMA — la función no implementa RMA.
const HABITAT = { aporte: 0.10, comision: 0.0147, primaSeguro: 0.0135 };
const INTEGRA  = { aporte: 0.10, comision: 0.0155, primaSeguro: 0.0135 };

describe('calcularDescuentoAfp - AFP Habitat', () => {
  it('calcula los tres componentes y total sobre S/1500 con tasas Habitat', () => {
    const result = calcularDescuentoAfp(1500, HABITAT);
    expect(result.aporte).toBeCloseTo(150.00, 2);
    expect(result.comision).toBeCloseTo(22.05, 2);
    expect(result.primaSeguro).toBeCloseTo(20.25, 2);
    expect(result.total).toBeCloseTo(192.30, 2);
  });

  it('retorna todos los componentes en cero cuando la remuneración es cero', () => {
    const result = calcularDescuentoAfp(0, HABITAT);
    expect(result.aporte).toBeCloseTo(0.00, 2);
    expect(result.comision).toBeCloseTo(0.00, 2);
    expect(result.primaSeguro).toBeCloseTo(0.00, 2);
    expect(result.total).toBeCloseTo(0.00, 2);
  });
});

describe('calcularDescuentoAfp - AFP Integra', () => {
  it('calcula los tres componentes y total sobre S/3000 con tasas Integra', () => {
    const result = calcularDescuentoAfp(3000, INTEGRA);
    expect(result.aporte).toBeCloseTo(300.00, 2);
    expect(result.comision).toBeCloseTo(46.50, 2);
    expect(result.primaSeguro).toBeCloseTo(40.50, 2);
    expect(result.total).toBeCloseTo(387.00, 2);
  });
});

// Tasas con prima real 2026 para pruebas RMA
const TASAS_RMA = { aporte: 0.10, comision: 0.0155, primaSeguro: 0.0137 };
const RMA_2026_ABR = 12598.91;

describe('calcularDescuentoAfp - Remuneración Máxima Asegurable (RMA)', () => {
  it('aplica RMA como tope de prima cuando la remuneración supera la RMA', () => {
    // primaSeguro = round2(12598.91 × 0.0137) = round2(172.605...) = 172.61
    // total = round2(1500 + 232.50 + 172.61) = 1905.11
    const result = calcularDescuentoAfp(15000, TASAS_RMA, RMA_2026_ABR);
    expect(result.aporte).toBeCloseTo(1500.00, 2);
    expect(result.comision).toBeCloseTo(232.50, 2);
    expect(result.primaSeguro).toBeCloseTo(172.61, 2);
    expect(result.total).toBeCloseTo(1905.11, 2);
  });

  it('no aplica tope RMA cuando la remuneración está por debajo de la RMA', () => {
    // primaSeguro = round2(5000 × 0.0137) = round2(68.5) = 68.50
    const result = calcularDescuentoAfp(5000, TASAS_RMA, RMA_2026_ABR);
    expect(result.aporte).toBeCloseTo(500.00, 2);
    expect(result.primaSeguro).toBeCloseTo(68.50, 2);
    expect(result.total).toBeCloseTo(646.00, 2);
  });

  it('calcula prima sin tope cuando no se pasa rma (regresión — comportamiento anterior)', () => {
    // primaSeguro = round2(15000 × 0.0137) = round2(205.5) = 205.50
    const result = calcularDescuentoAfp(15000, TASAS_RMA);
    expect(result.primaSeguro).toBeCloseTo(205.50, 2);
    expect(result.total).toBeCloseTo(1938.00, 2);
  });
});
