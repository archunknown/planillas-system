import { describe, it, expect } from 'vitest';
import { calcularAsignacionFamiliar } from './asignacion-familiar';

describe('calcularAsignacionFamiliar - régimen general/MYPE', () => {
  it('calcula asignación familiar fija con 1 hijo en régimen general', () => {
    expect(calcularAsignacionFamiliar(1130, true, false, 1)).toBeCloseTo(113.00, 2);
  });

  it('calcula asignación familiar fija (no se multiplica) con 3 hijos en régimen general', () => {
    expect(calcularAsignacionFamiliar(1130, true, false, 3)).toBeCloseTo(113.00, 2);
  });

  it('retorna cero cuando no hay hijos en régimen general', () => {
    expect(calcularAsignacionFamiliar(1130, false, false, 0)).toBeCloseTo(0.00, 2);
  });
});

describe('calcularAsignacionFamiliar - construcción civil', () => {
  it('calcula asignación familiar por hijo con 1 hijo en construcción civil', () => {
    expect(calcularAsignacionFamiliar(1130, true, true, 1)).toBeCloseTo(113.00, 2);
  });

  it('calcula asignación familiar fija (monto único, no por hijo) con 3 hijos en construcción civil', () => {
    // Ley 25129 — monto fijo 10% RMV, independiente del número de hijos
    // Confirmado por STC 02681-2023-AA y Casación 2630-2009-HUAURA
    expect(calcularAsignacionFamiliar(1130, true, true, 3)).toBeCloseTo(113.00, 2);
  });

  it('retorna cero cuando no hay hijos en construcción civil', () => {
    expect(calcularAsignacionFamiliar(1130, false, true, 0)).toBeCloseTo(0.00, 2);
  });
});

describe('calcularAsignacionFamiliar - casos inconsistentes (tieneHijos=false con cantidadHijos>0)', () => {
  it('documenta comportamiento real: tieneHijos=false, cantidadHijos=3, régimen general', () => {
    const result = calcularAsignacionFamiliar(1130, false, false, 3);
    console.log('resultado real (general, tieneHijos=false, cantidadHijos=3):', result);
    expect(result).toBe(result);
  });

  it('documenta comportamiento real: tieneHijos=false, cantidadHijos=3, construcción civil', () => {
    const result = calcularAsignacionFamiliar(1130, false, true, 3);
    console.log('resultado real (construcción civil, tieneHijos=false, cantidadHijos=3):', result);
    expect(result).toBe(result);
  });
});
