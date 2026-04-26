import { describe, it, expect } from 'vitest';
import { calcularRemuneracionProporcional, calcularValorHora } from './remuneracion';

describe('calcularRemuneracionProporcional', () => {
  it('calcula sueldo completo por 30 días trabajados', () => {
    expect(calcularRemuneracionProporcional(1500, 30)).toBeCloseTo(1500.00, 2);
  });

  it('calcula sueldo proporcional por 15 días trabajados', () => {
    expect(calcularRemuneracionProporcional(1500, 15)).toBeCloseTo(750.00, 2);
  });

  it('calcula sueldo proporcional por 1 día trabajado', () => {
    expect(calcularRemuneracionProporcional(1500, 1)).toBeCloseTo(50.00, 2);
  });

  it('retorna cero cuando no hay días trabajados', () => {
    expect(calcularRemuneracionProporcional(1500, 0)).toBeCloseTo(0.00, 2);
  });
});

describe('calcularValorHora', () => {
  it('calcula valor hora para jornada estándar de 8 horas diarias', () => {
    // D.S. 007-2002-TR art. 11 — pasar horas diarias habituales, no horas semanales
    expect(calcularValorHora(1500, 8)).toBeCloseTo(6.25, 2);
  });

  it('calcula valor hora para jornada reducida de 6 horas diarias', () => {
    expect(calcularValorHora(1500, 6)).toBeCloseTo(8.33, 2);
  });

  it('calcula valor hora correcto para jornada de oficina 5 días × 8h = 40h semanales', () => {
    // Antes (jornadaSemanal): calcularValorHora(1500, 40) = 1500/30/(40/6) = 7.50 (incorrecto)
    // Ahora: pasar horasDiariasHabituales=8 → 1500/30/8 = 6.25 (correcto)
    // D.S. 007-2002-TR art. 11 — la fórmula opera sobre días, independiente de días de la semana
    expect(calcularValorHora(1500, 8)).toBeCloseTo(6.25, 2);
  });
});
