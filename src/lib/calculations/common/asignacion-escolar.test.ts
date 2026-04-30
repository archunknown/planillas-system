import { describe, it, expect } from 'vitest';
import { calcularAsignacionEscolar } from './asignacion-escolar';

// Base legal: Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR)
// 30 jornales básicos al año por hijo en edad escolar (hasta 24 años).
// Carácter NO remunerativo — no afecta EsSalud ni aportes pensionarios.

describe('calcularAsignacionEscolar - modalidad ANUAL', () => {
  it('calcula asignación escolar anual para operario con 1 hijo', () => {
    // round2(89.30 × 30 × 1) = 2679.00
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 89.30,
      cantidadHijosEnEdadEscolar: 1,
      modalidad: 'ANUAL',
    });
    expect(r.montoTotal).toBeCloseTo(2679.00, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(2679.00, 2);
  });

  it('calcula asignación escolar anual para peón con 2 hijos', () => {
    // round2(62.80 × 30 × 2) = 3768.00
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 62.80,
      cantidadHijosEnEdadEscolar: 2,
      modalidad: 'ANUAL',
    });
    expect(r.montoTotal).toBeCloseTo(3768.00, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(3768.00, 2);
  });

  it('retorna cero cuando no hay hijos en edad escolar', () => {
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 89.30,
      cantidadHijosEnEdadEscolar: 0,
      modalidad: 'ANUAL',
    });
    expect(r.montoTotal).toBeCloseTo(0.00, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(0.00, 2);
  });
});

describe('calcularAsignacionEscolar - modalidad PRORRATEO_MENSUAL', () => {
  it('prorratea en 12 mensualidades para operario con 1 hijo', () => {
    // montoAnual = 2679.00 → mensual = round2(2679/12) = 223.25
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 89.30,
      cantidadHijosEnEdadEscolar: 1,
      modalidad: 'PRORRATEO_MENSUAL',
    });
    expect(r.montoTotal).toBeCloseTo(223.25, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(2679.00, 2);
  });

  it('prorratea en 12 mensualidades para peón con 2 hijos', () => {
    // montoAnual = 3768.00 → mensual = round2(3768/12) = 314.00
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 62.80,
      cantidadHijosEnEdadEscolar: 2,
      modalidad: 'PRORRATEO_MENSUAL',
    });
    expect(r.montoTotal).toBeCloseTo(314.00, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(3768.00, 2);
  });

  it('retorna cero cuando no hay hijos (prorrateo)', () => {
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 89.30,
      cantidadHijosEnEdadEscolar: 0,
      modalidad: 'PRORRATEO_MENSUAL',
    });
    expect(r.montoTotal).toBeCloseTo(0.00, 2);
  });
});

describe('calcularAsignacionEscolar - override jornalesPorHijoAnual', () => {
  it('aplica 25 jornales por hijo cuando se sobreescribe el parámetro', () => {
    // round2(89.30 × 25 × 1) = 2232.50
    const r = calcularAsignacionEscolar({
      jornalBasicoDiario: 89.30,
      cantidadHijosEnEdadEscolar: 1,
      modalidad: 'ANUAL',
      jornalesPorHijoAnual: 25,
    });
    expect(r.montoTotal).toBeCloseTo(2232.50, 2);
    expect(r.montoAnualEquivalente).toBeCloseTo(2232.50, 2);
  });
});
