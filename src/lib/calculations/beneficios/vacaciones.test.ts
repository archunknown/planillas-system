import { describe, it, expect } from 'vitest';
import { calcularVacacionesTruncas } from './vacaciones';

// Solo existe calcularVacacionesTruncas. El caso "vacaciones anuales completas"
// se testea pasando mesesComputables=12 y diasComputables=0.

describe('calcularVacacionesTruncas - año completo', () => {
  it('calcula vacaciones equivalentes a un sueldo completo por 12 meses trabajados', () => {
    const result = calcularVacacionesTruncas({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 12,
      diasComputables: 0,
    });
    expect(result.montoPorMeses).toBeCloseTo(1500.00, 2);
    expect(result.montoPorDias).toBeCloseTo(0.00, 2);
    expect(result.total).toBeCloseTo(1500.00, 2);
  });
});

describe('calcularVacacionesTruncas - proporcional', () => {
  it('calcula vacaciones truncas por 6 meses completos sin días adicionales', () => {
    const result = calcularVacacionesTruncas({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 6,
      diasComputables: 0,
    });
    expect(result.montoPorMeses).toBeCloseTo(750.00, 2);
    expect(result.montoPorDias).toBeCloseTo(0.00, 2);
    expect(result.total).toBeCloseTo(750.00, 2);
  });

  it('calcula vacaciones truncas por 3 meses completos más 15 días adicionales', () => {
    // montoPorMeses = (1500/12)*3 = 375. montoPorDias = (1500/360)*15 = 62.50.
    const result = calcularVacacionesTruncas({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 3,
      diasComputables: 15,
    });
    expect(result.montoPorMeses).toBeCloseTo(375.00, 2);
    expect(result.montoPorDias).toBeCloseTo(62.50, 2);
    expect(result.total).toBeCloseTo(437.50, 2);
  });

  it('retorna cero cuando no hay meses ni días computables', () => {
    const result = calcularVacacionesTruncas({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 0,
      diasComputables: 0,
    });
    expect(result.total).toBeCloseTo(0.00, 2);
  });
});
