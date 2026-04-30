import { describe, it, expect } from 'vitest';
import { calcularPlanillaMype, calcularGratificacionMypePequena } from './mype';
import type { DatosPeriodoInput } from './types';

// Parámetros legales 2026 (seed)
const RMV = 1130;
const UIT = 5500;

const datosBase = (overrides?: Partial<DatosPeriodoInput>): DatosPeriodoInput => ({
  remuneracionBase: 1500,
  diasTrabajados: 30,
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
  remuneracionMensualProyectada: 1500,
  gratificacionesAnualesProyectadas: 3000,
  mesActual: 1,
  retencionesQuintaAnteriores: 0,
  tasaEssalud: 0.09,
  tasaSctr: 0,
  ...overrides,
});

describe('calcularPlanillaMype - microempresa (esMicro=true)', () => {
  it('calcula ONP y aplica cuota SIS S/15 en vez de EsSalud proporcional', () => {
    // remuneracionBasica = 1130
    // ONP = round2(1130*0.13) = 146.90
    // essalud = 15 (SIS cuota fija, no 9%)
    // neto = 1130-146.90 = 983.10
    const r = calcularPlanillaMype(datosBase({ remuneracionBase: 1130 }), true);

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1130.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1130.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(146.90, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(146.90, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(15.00, 2);
    expect(r.aportesEmpleador.totalAportesEmpleador).toBeCloseTo(15.00, 2);
    expect(r.netoPagar).toBeCloseTo(983.10, 2);
  });

  it('ignora tieneAsignacionFamiliar — microempresa no paga asignación familiar', () => {
    // La ley 28015 no obliga AF en microempresa; la implementación hardcodea asignacionFamiliar=0
    const r = calcularPlanillaMype(
      datosBase({ remuneracionBase: 1130, tieneAsignacionFamiliar: true, cantidadHijos: 1 }),
      true,
    );

    expect(r.ingresos.asignacionFamiliar).toBeCloseTo(0.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1130.00, 2);
  });

  it('aplica cuota SIS configurable cuando se pasa cuotaSisMicro distinta al default', () => {
    // Si la cuota SIS cambia por ley, se puede pasar el nuevo valor
    const r = calcularPlanillaMype(datosBase({ remuneracionBase: 1130 }), true, 20);

    expect(r.aportesEmpleador.essalud).toBeCloseTo(20.00, 2);
  });
});

describe('calcularPlanillaMype - pequeña empresa (esMicro=false)', () => {
  it('calcula ONP y EsSalud 9% proporcional (no SIS fijo)', () => {
    // remuneracionBasica = 1500
    // ONP = 195
    // EsSalud = round2(1500*0.09) = 135
    // neto = 1305
    const r = calcularPlanillaMype(datosBase(), false);

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1500.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1500.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(195.00, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
    expect(r.netoPagar).toBeCloseTo(1305.00, 2);
  });

  it('incluye asignación familiar en pequeña empresa con hijos', () => {
    // asignacionFamiliar = round2(1130*0.10) = 113
    // totalIngresos = 1500+113 = 1613
    // ONP = round2(1613*0.13) = round2(209.69) = 209.69
    // EsSalud = round2(1613*0.09) = round2(145.17) = 145.17
    const r = calcularPlanillaMype(
      datosBase({ tieneAsignacionFamiliar: true, cantidadHijos: 1 }),
      false,
    );

    expect(r.ingresos.asignacionFamiliar).toBeCloseTo(113.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1613.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(209.69, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(145.17, 2);
  });
});

describe('calcularGratificacionMypePequena - D.S. 013-2013-PRODUCE art. 41', () => {
  it('calcula gratificación de pequeña empresa (×0.50) para 6 meses completos', () => {
    // calcularGratificacion base: gratBase = 1500*(6/6) = 1500, bonifExt = 1500*0.09 = 135, total = 1635
    // factor 0.50: gratBase = 750, bonifExt = 67.50, total = 817.50
    const r = calcularGratificacionMypePequena({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 6,
      tasaEssalud: 0.09,
    });

    expect(r.gratificacionBase).toBeCloseTo(750.00, 2);
    expect(r.bonificacionExtraordinaria).toBeCloseTo(67.50, 2);
    expect(r.total).toBeCloseTo(817.50, 2);
  });

  it('calcula gratificación de pequeña empresa (×0.50) para 3 meses computables', () => {
    // calcularGratificacion base: gratBase = 1500*(3/6) = 750, bonifExt = 750*0.09 = 67.50, total = 817.50
    // factor 0.50: gratBase = 375, bonifExt = 33.75, total = 408.75
    const r = calcularGratificacionMypePequena({
      remuneracionBase: 1500,
      asignacionFamiliar: 0,
      mesesComputables: 3,
      tasaEssalud: 0.09,
    });

    expect(r.gratificacionBase).toBeCloseTo(375.00, 2);
    expect(r.bonificacionExtraordinaria).toBeCloseTo(33.75, 2);
    expect(r.total).toBeCloseTo(408.75, 2);
  });
});
