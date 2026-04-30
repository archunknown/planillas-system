import { describe, it, expect } from 'vitest';
import { calcularRetencionQuinta } from './quinta-categoria';

// Todos los casos usan mesActual=1 → mesesRestantes=12 y retencionesAnteriores=0
// para aislar la lógica de proyección y tramos sin efecto del acumulado previo.

const UIT_2026 = 5350;

describe('calcularRetencionQuinta - trabajador bajo el umbral', () => {
  it('retorna retención cero cuando la renta anual proyectada no supera las 7 UIT', () => {
    // Proyección: 2000*12 + 4000 = 28,000 < 37,450 (7 UIT)
    const result = calcularRetencionQuinta({
      remuneracionMensual: 2000,
      gratificacionesAnuales: 4000,
      mesActual: 1,
      retencionesAnteriores: 0,
      uit: UIT_2026,
    });
    expect(result.rentaAnualProyectada).toBeCloseTo(28000, 2);
    expect(result.deduccion7UIT).toBeCloseTo(37450, 2);
    expect(result.rentaImponible).toBeCloseTo(0, 2);
    expect(result.impuestoAnual).toBeCloseTo(0, 2);
    expect(result.retencionMensual).toBeCloseTo(0, 2);
  });
});

describe('calcularRetencionQuinta - trabajador levemente sobre el umbral', () => {
  it('calcula retención mensual cuando la base imponible cae íntegra en el tramo del 8%', () => {
    // Proyección: 3500*12 + 7000 = 49,000
    // Base: 49,000 - 37,450 = 11,550 (< 5 UIT = 26,750 → tramo 8%)
    // Impuesto: 11,550 * 0.08 = 924
    // Retención: 924 / 12 = 77.00
    const result = calcularRetencionQuinta({
      remuneracionMensual: 3500,
      gratificacionesAnuales: 7000,
      mesActual: 1,
      retencionesAnteriores: 0,
      uit: UIT_2026,
    });
    expect(result.rentaAnualProyectada).toBeCloseTo(49000, 2);
    expect(result.deduccion7UIT).toBeCloseTo(37450, 2);
    expect(result.rentaImponible).toBeCloseTo(11550, 2);
    expect(result.impuestoAnual).toBeCloseTo(924, 2);
    expect(result.retencionMensual).toBeCloseTo(77.00, 2);
  });
});

describe('calcularRetencionQuinta - trabajador de ingreso medio-alto', () => {
  it('calcula retención mensual aplicando tramos 8% y 14% correctamente', () => {
    // Proyección: 10,000*12 + 20,000 = 140,000
    // Base: 140,000 - 37,450 = 102,550
    // Tramo 1 (hasta 5 UIT = 26,750): 26,750 * 0.08 = 2,140
    // Tramo 2 (hasta 20 UIT = 107,000, ancho 80,250): restante 75,800 * 0.14 = 10,612
    // Impuesto anual: 12,752
    // Retención: 12,752 / 12 ≈ 1,062.67
    const result = calcularRetencionQuinta({
      remuneracionMensual: 10000,
      gratificacionesAnuales: 20000,
      mesActual: 1,
      retencionesAnteriores: 0,
      uit: UIT_2026,
    });
    expect(result.rentaAnualProyectada).toBeCloseTo(140000, 2);
    expect(result.deduccion7UIT).toBeCloseTo(37450, 2);
    expect(result.rentaImponible).toBeCloseTo(102550, 2);
    expect(result.impuestoAnual).toBeCloseTo(12752, 2);
    expect(result.retencionMensual).toBeCloseTo(1062.67, 2);
  });
});
