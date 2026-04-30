import { describe, it, expect } from 'vitest';
import { calcularPlanillaAgrario } from './agrario';
import type { DatosPeriodoInput } from './types';

// Parámetros legales 2026 (seed)
const RMV = 1130;
const UIT = 5500;

// Tasa EsSalud agrario (seed): menor/pequeña 6%, mayor/grande 9%
const ESSALUD_AGRARIO_MENOR = 0.06;
const ESSALUD_AGRARIO_MAYOR = 0.09;

// Remuneración diaria agraria de referencia: 51.25 S/día (≈ RMV/22, parámetro libre)
const REM_DIARIA = 51.25;

const datosBase = (overrides?: Partial<DatosPeriodoInput>): DatosPeriodoInput => ({
  remuneracionBase: 0,              // no usado — calcularPlanillaAgrario usa remuneracionDiariaAgraria
  diasTrabajados: 26,
  horasExtras25: 0,
  horasExtras35: 0,
  horasExtras100: 0,
  faltas: 0,
  feriados: 0,
  jornadaSemanal: 48,
  tieneAsignacionFamiliar: false,
  cantidadHijos: 0,
  rmv: RMV,
  uit: UIT,
  sistemaPensionario: 'ONP',
  afpTasas: null,
  remuneracionMensualProyectada: 1400,    // proyección ≈ 19600 < 38500 → quinta = 0
  gratificacionesAnualesProyectadas: 2800,
  mesActual: 1,
  retencionesQuintaAnteriores: 0,
  tasaEssalud: ESSALUD_AGRARIO_MENOR,    // empresa pequeña por defecto
  tasaSctr: 0,
  agrario: { modoPago: 'SEMESTRAL' as const },  // modo explícito para compatibilidad con tests anteriores
  ...overrides,
});

describe('calcularPlanillaAgrario - empresa agraria pequeña (EsSalud 6%)', () => {
  it('calcula remuneración diaria × días y aplica EsSalud 6% sobre la remuneración bruta', () => {
    // remuneracionBasica = round2(51.25×26) = 1332.50
    // ONP = round2(1332.50×0.13) = round2(173.225) = 173.23
    // EsSalud = round2(1332.50×0.06) = round2(79.95) = 79.95
    // neto = round2(1332.50−173.23) = 1159.27
    const r = calcularPlanillaAgrario(datosBase(), REM_DIARIA);

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1332.50, 2);
    expect(r.ingresos.horasExtrasTotal).toBeCloseTo(0.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1332.50, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(173.23, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(173.23, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(79.95, 2);
    expect(r.netoPagar).toBeCloseTo(1159.27, 2);
  });
});

describe('calcularPlanillaAgrario - empresa agraria grande (EsSalud 9%)', () => {
  it('aplica EsSalud 9% via tercer parámetro explícito (independiente de datos.tasaEssalud)', () => {
    // EsSalud = round2(1332.50×0.09) = round2(119.925) = 119.93
    // neto del trabajador no cambia — EsSalud es aporte del empleador
    const r = calcularPlanillaAgrario(datosBase(), REM_DIARIA, ESSALUD_AGRARIO_MAYOR);

    expect(r.aportesEmpleador.essalud).toBeCloseTo(119.93, 2);
    expect(r.netoPagar).toBeCloseTo(1159.27, 2); // mismo que empresa pequeña
  });

  it('aplica EsSalud 9% via datos.tasaEssalud cuando no se pasa tercer parámetro', () => {
    // Equivalente al comportamiento del orquestador: pasa datos.tasaEssalud=0.09
    const r = calcularPlanillaAgrario(
      datosBase({ tasaEssalud: ESSALUD_AGRARIO_MAYOR }),
      REM_DIARIA,
    );

    expect(r.aportesEmpleador.essalud).toBeCloseTo(119.93, 2);
  });
});

describe('calcularPlanillaAgrario - con asignación familiar', () => {
  it('incluye asignación familiar (tasa fija RMV×10%, no por hijo) y aplica ONP sobre el total', () => {
    // asignacionFamiliar = round2(1130×0.10) = 113
    // totalIngresos = remuneracionBruta = round2(1332.50+113) = 1445.50
    // ONP = round2(1445.50×0.13) = round2(187.915) = 187.92
    // EsSalud (6%) = round2(1445.50×0.06) = round2(86.73) = 86.73
    // neto = round2(1445.50−187.92) = 1257.58
    const r = calcularPlanillaAgrario(
      datosBase({ tieneAsignacionFamiliar: true, cantidadHijos: 1 }),
      REM_DIARIA,
    );

    expect(r.ingresos.asignacionFamiliar).toBeCloseTo(113.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1445.50, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(187.92, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(86.73, 2);
    expect(r.netoPagar).toBeCloseTo(1257.58, 2);
  });
});

describe('calcularPlanillaAgrario - edge cases', () => {
  it('retorna todo en cero para trabajador sin días trabajados', () => {
    const r = calcularPlanillaAgrario(datosBase({ diasTrabajados: 0 }), REM_DIARIA);

    expect(r.ingresos.totalIngresos).toBeCloseTo(0.00, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(0.00, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(0.00, 2);
    expect(r.netoPagar).toBeCloseTo(0.00, 2);
  });
});

// Remuneración diaria base (sin prorrateo) para tests de modo de pago
const REM_DIARIA_BASE = 37.67;

describe('calcularPlanillaAgrario - modoPago PRORRATEADO (Ley 31110 art. 8, D.S. 005-2021-MIDAGRI)', () => {
  it('integra gratificación (16.66%) y CTS (9.72%) en la remuneración básica diaria', () => {
    // rb = round2(37.67×26) = 979.42
    // gratProrrateada = round2(979.42×0.1666) = 163.17
    // ctsProrrateada  = round2(979.42×0.0972) = 95.20
    // remuneracionBasica = round2(979.42+163.17+95.20) = 1237.79
    const r = calcularPlanillaAgrario(
      datosBase({ agrario: { modoPago: 'PRORRATEADO' as const } }),
      REM_DIARIA_BASE,
    );
    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1237.79, 2);
  });

  it('modo SEMESTRAL: no añade prorrateo — remuneración básica = jornal × días', () => {
    // rb = round2(37.67×26) = 979.42 (sin extras)
    const r = calcularPlanillaAgrario(
      datosBase({ agrario: { modoPago: 'SEMESTRAL' as const } }),
      REM_DIARIA_BASE,
    );
    expect(r.ingresos.remuneracionBasica).toBeCloseTo(979.42, 2);
  });

  it('default (sin campo agrario) equivale a PRORRATEADO', () => {
    // datos.agrario undefined → modoPago defaultea a PRORRATEADO
    const r = calcularPlanillaAgrario(
      datosBase({ agrario: undefined }),
      REM_DIARIA_BASE,
    );
    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1237.79, 2);
  });
});

describe('calcularPlanillaAgrario - BETA Bonificación Especial Trabajo Agrario (Ley 31110 art. 8 inc. 2)', () => {
  it('BETA 30 días: bonificacionAgraria = 30% RMV y se suma a totalIngresos (no a base pensionable)', () => {
    // beta = round2(1130×0.30×(30/30)) = 339.00
    // remuneracionBruta no cambia — BETA no es remunerativo
    const r = calcularPlanillaAgrario(
      datosBase({ diasTrabajados: 30, recibeBETA: true }),
      REM_DIARIA,
    );
    expect(r.ingresos.bonificacionAgraria).toBeCloseTo(339.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(
      round2(r.ingresos.remuneracionBasica + r.ingresos.asignacionFamiliar + 339.00), 2
    );
  });

  it('BETA 15 días: bonificacionAgraria proporcional a fracción del mes', () => {
    // beta = round2(1130×0.30×(15/30)) = round2(169.50) = 169.50
    const r = calcularPlanillaAgrario(
      datosBase({ diasTrabajados: 15, recibeBETA: true }),
      REM_DIARIA,
    );
    expect(r.ingresos.bonificacionAgraria).toBeCloseTo(169.50, 2);
  });

  it('sin BETA: bonificacionAgraria es cero (comportamiento por defecto)', () => {
    const r = calcularPlanillaAgrario(datosBase(), REM_DIARIA);
    expect(r.ingresos.bonificacionAgraria).toBeCloseTo(0.00, 2);
  });
});

function round2(v: number) { return Math.round(v * 100) / 100; }
