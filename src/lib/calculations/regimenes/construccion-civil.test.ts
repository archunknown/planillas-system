import { describe, it, expect } from 'vitest';
import { calcularPlanillaCC } from './construccion-civil';
import type { DatosPeriodoInput } from './types';

// ─── Fórmulas implementadas (documentadas para referencia) ───────────────────
// remuneracionBasica = jornalDiario × diasTrabajados
// bonificacionCC     = jornalDiario × porcentajeBuc × diasTrabajados
// movilidadCC        = movilidadDiaria × diasTrabajados
// bonificacionAltura = jornalDiario × 0.07 × diasTrabajados  (solo si trabajaEnAltura)
// asignacionFamiliar = RMV × 0.10  (per-hijo, esConstruccionCivil=true)
//
// remuneracionBruta (base pensionable) = remuneracionBasica + bonificacionCC + asignacionFamiliar
//   ⚠️  movilidad y bonificacionAltura NO entran en remuneracionBruta — no son pensionables
//
// totalIngresos = remuneracionBasica + bonificacionCC + movilidadCC + bonificacionAltura + asignacionFamiliar
// ONP/AFP       → sobre remuneracionBruta
// EsSalud       → remuneracionBruta × 0.09
// SCTR          → remuneracionBruta × tasaSctr
// netoPagar     = max(0, totalIngresos − totalDescuentos)
//
// Jornales CAPECO 2026 usados (no están en seed — parámetro libre):
//   Operario S/85.10/día | Oficial S/70.30/día | Peón S/62.80/día
// ────────────────────────────────────────────────────────────────────────────

const RMV = 1130;
const UIT = 5500;

const datosCC = (overrides?: Partial<DatosPeriodoInput>): DatosPeriodoInput => ({
  remuneracionBase: 0,          // no usado por calcularPlanillaCC
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
  remuneracionMensualProyectada: 2500,  // proyección ≈ 35000 < 7 UIT (38500) → quinta = 0
  gratificacionesAnualesProyectadas: 5000,
  mesActual: 1,
  retencionesQuintaAnteriores: 0,
  tasaEssalud: 0.09,
  tasaSctr: 0,
  ...overrides,
});

describe('calcularPlanillaCC - Operario sin bonificaciones', () => {
  it('calcula jornal diario × días sin BUC, movilidad ni altura', () => {
    // remuneracionBasica = 85.10×26 = 2212.60
    // remuneracionBruta  = 2212.60 (= totalIngresos, sin extras)
    // ONP = round2(2212.60×0.13) = round2(287.638) = 287.64
    // EsSalud = round2(2212.60×0.09) = round2(199.134) = 199.13
    // neto = round2(2212.60−287.64) = 1924.96
    const r = calcularPlanillaCC(datosCC(), {
      jornalDiario: 85.10,
      categoriaCC: 'OPERARIO',
      diasTrabajados: 26,
      porcentajeBuc: 0,
      movilidadDiaria: 0,
      trabajaEnAltura: false,
    });

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(2212.60, 2);
    expect(r.ingresos.bonificacionCC).toBeCloseTo(0.00, 2);
    expect(r.ingresos.movilidadCC).toBeCloseTo(0.00, 2);
    expect(r.ingresos.bonificacionAltura).toBeCloseTo(0.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(2212.60, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(287.64, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(199.13, 2);
    expect(r.netoPagar).toBeCloseTo(1924.96, 2);
  });
});

describe('calcularPlanillaCC - Operario con BUC 32%', () => {
  it('incluye BUC en remuneracionBruta y aplica ONP sobre el total pensionable', () => {
    // bonificacionCC = round2(85.10×0.32×26) = round2(708.032) = 708.03
    // remuneracionBruta = round2(2212.60+708.03) = 2920.63
    // totalIngresos     = 2920.63 (sin movilidad ni altura)
    // ONP = round2(2920.63×0.13) = round2(379.6819) = 379.68
    // EsSalud = round2(2920.63×0.09) = round2(262.8567) = 262.86
    // neto = round2(2920.63−379.68) = 2540.95
    const r = calcularPlanillaCC(datosCC(), {
      jornalDiario: 85.10,
      categoriaCC: 'OPERARIO',
      diasTrabajados: 26,
      porcentajeBuc: 0.32,
      movilidadDiaria: 0,
      trabajaEnAltura: false,
    });

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(2212.60, 2);
    expect(r.ingresos.bonificacionCC).toBeCloseTo(708.03, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(2920.63, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(379.68, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(262.86, 2);
    expect(r.netoPagar).toBeCloseTo(2540.95, 2);
  });
});

describe('calcularPlanillaCC - Peón con movilidad (no pensionable)', () => {
  it('suma movilidad a totalIngresos pero la excluye de la base pensionable', () => {
    // remuneracionBasica = round2(62.80×26) = 1632.80
    // movilidadCC        = round2(20×26) = 520.00
    // totalIngresos      = round2(1632.80+520) = 2152.80
    // remuneracionBruta  = 1632.80 (movilidad NO entra)
    // ONP = round2(1632.80×0.13) = round2(212.264) = 212.26
    // EsSalud = round2(1632.80×0.09) = round2(146.952) = 146.95
    // neto = round2(2152.80−212.26) = 1940.54
    const r = calcularPlanillaCC(datosCC(), {
      jornalDiario: 62.80,
      categoriaCC: 'PEON',
      diasTrabajados: 26,
      porcentajeBuc: 0,
      movilidadDiaria: 20,
      trabajaEnAltura: false,
    });

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1632.80, 2);
    expect(r.ingresos.movilidadCC).toBeCloseTo(520.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(2152.80, 2);
    // ONP/EsSalud se calculan sobre 1632.80, no sobre 2152.80
    expect(r.descuentos.descuentoOnp).toBeCloseTo(212.26, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(146.95, 2);
    expect(r.netoPagar).toBeCloseTo(1940.54, 2);
  });
});

describe('calcularPlanillaCC - bonificación por altura (no pensionable)', () => {
  it('suma bonificacionAltura a totalIngresos pero la excluye de la base pensionable', () => {
    // Bonificación 8% según Convenio CAPECO-FTCCP 2026 (R.M. 197-2025-TR)
    // bonificacionAltura = round2(85.10×0.08×26) = round2(177.008) = 177.01
    // totalIngresos      = round2(2212.60+177.01) = 2389.61
    // remuneracionBruta  = 2212.60 (sin altura — no pensionable)
    // ONP y EsSalud no cambian respecto al caso sin altura
    const r = calcularPlanillaCC(datosCC(), {
      jornalDiario: 85.10,
      categoriaCC: 'OPERARIO',
      diasTrabajados: 26,
      porcentajeBuc: 0,
      movilidadDiaria: 0,
      trabajaEnAltura: true,
    });

    expect(r.ingresos.bonificacionAltura).toBeCloseTo(177.01, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(2389.61, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(287.64, 2);   // igual que sin altura
    expect(r.aportesEmpleador.essalud).toBeCloseTo(199.13, 2);  // igual que sin altura
    expect(r.netoPagar).toBeCloseTo(2101.97, 2);
  });
});

describe('calcularPlanillaCC - SCTR', () => {
  it('calcula SCTR sobre la base pensionable con tasa configurable', () => {
    // tasaSctr = 0.0067 (SCTR pensión, referencia de mercado)
    // sctr = round2(2212.60×0.0067) = round2(14.82442) = 14.82
    // totalAportesEmpleador = round2(199.13+14.82) = 213.95
    const r = calcularPlanillaCC(datosCC({ tasaSctr: 0.0067 }), {
      jornalDiario: 85.10,
      categoriaCC: 'OPERARIO',
      diasTrabajados: 26,
      porcentajeBuc: 0,
      movilidadDiaria: 0,
      trabajaEnAltura: false,
    });

    expect(r.aportesEmpleador.sctr).toBeCloseTo(14.82, 2);
    expect(r.aportesEmpleador.totalAportesEmpleador).toBeCloseTo(213.95, 2);
  });
});
