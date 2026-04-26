import { describe, it, expect } from 'vitest';
import { calcularPlanillaGeneral } from './general';
import type { DatosPeriodoInput } from './types';

// Parámetros legales 2026 (seed)
const RMV = 1130;
const UIT = 5500;

// Habitat 2026: aporte 10%, comisión 1.47%, prima 1.37% (seed: AFP_HABITAT_PRIMA = 0.0137)
const AFP_HABITAT = { aporte: 0.10, comision: 0.0147, primaSeguro: 0.0137 };

const datosBase = (overrides?: Partial<DatosPeriodoInput>): DatosPeriodoInput => ({
  remuneracionBase: 1500,
  diasTrabajados: 30,
  horasExtras25: 0,
  horasExtras35: 0,
  horasExtras100: 0,
  faltas: 0,
  feriados: 0,
  jornadaSemanal: 48,           // 8h/día × 6 días
  tieneAsignacionFamiliar: false,
  cantidadHijos: 0,
  rmv: RMV,
  uit: UIT,
  sistemaPensionario: 'ONP',
  afpTasas: null,
  remuneracionMensualProyectada: 1500,
  gratificacionesAnualesProyectadas: 3000, // 2 × 1500, trabajador bajo umbral quinta
  mesActual: 1,
  retencionesQuintaAnteriores: 0,
  tasaEssalud: 0.09,
  tasaSctr: 0,
  ...overrides,
});

describe('calcularPlanillaGeneral - caso base (ONP, 30 días, sin hijos)', () => {
  it('calcula ingresos, ONP, EsSalud y neto correctamente para trabajador completo sin hijos', () => {
    // remuneracionBasica = 1500/30*30 = 1500
    // ONP = 1500*0.13 = 195
    // EsSalud = 1500*0.09 = 135
    // neto = 1500-195 = 1305
    const r = calcularPlanillaGeneral(datosBase());

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1500.00, 2);
    expect(r.ingresos.horasExtrasTotal).toBeCloseTo(0.00, 2);
    expect(r.ingresos.asignacionFamiliar).toBeCloseTo(0.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1500.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(195.00, 2);
    expect(r.descuentos.retencionQuinta).toBeCloseTo(0.00, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(195.00, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
    expect(r.aportesEmpleador.sctr).toBeCloseTo(0.00, 2);
    expect(r.netoPagar).toBeCloseTo(1305.00, 2);
  });
});

describe('calcularPlanillaGeneral - con asignación familiar y horas extras', () => {
  it('suma asignación familiar y horas extras al bruto y aplica ONP sobre el total', () => {
    // valorHora = calcularValorHora(1500, 8) = 1500/30/8 = 6.25
    // monto25 = round2(6.25*1.25*2) = round2(15.625) = 15.63
    // asignacionFamiliar = round2(1130*0.10) = 113.00
    // totalIngresos = round2(1500+15.63+113) = 1628.63
    // ONP = round2(1628.63*0.13) = round2(211.7219) = 211.72
    // EsSalud = round2(1628.63*0.09) = round2(146.5767) = 146.58
    // neto = round2(1628.63-211.72) = 1416.91
    const r = calcularPlanillaGeneral(datosBase({
      horasExtras25: 2,
      tieneAsignacionFamiliar: true,
      cantidadHijos: 1,
    }));

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1500.00, 2);
    expect(r.ingresos.horasExtrasTotal).toBeCloseTo(15.63, 2);
    expect(r.ingresos.asignacionFamiliar).toBeCloseTo(113.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(1628.63, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(211.72, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(211.72, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(146.58, 2);
    expect(r.netoPagar).toBeCloseTo(1416.91, 2);
  });
});

describe('calcularPlanillaGeneral - afiliado AFP Habitat', () => {
  it('desglosa aporte, comisión y prima AFP correctamente (tasas seed 2026)', () => {
    // descuentoAfp = round2(1500*0.10) = 150.00
    // comisionAfp  = round2(1500*0.0147) = 22.05
    // primaSeguro  = round2(1500*0.0137) = 20.55
    // totalDescuentos = round2(150+22.05+20.55) = 192.60
    // neto = 1500-192.60 = 1307.40
    const r = calcularPlanillaGeneral(datosBase({
      sistemaPensionario: 'AFP',
      afpTasas: AFP_HABITAT,
    }));

    expect(r.descuentos.descuentoOnp).toBeCloseTo(0.00, 2);
    expect(r.descuentos.descuentoAfp).toBeCloseTo(150.00, 2);
    expect(r.descuentos.comisionAfp).toBeCloseTo(22.05, 2);
    expect(r.descuentos.primaSeguroAfp).toBeCloseTo(20.55, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(192.60, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
    expect(r.netoPagar).toBeCloseTo(1307.40, 2);
  });
});

describe('calcularPlanillaGeneral - remuneración proporcional por días', () => {
  it('calcula sueldo y ONP proporcional para 15 días trabajados', () => {
    // remuneracionBasica = 1500/30*15 = 750
    // ONP = 750*0.13 = 97.50
    // EsSalud = 750*0.09 = 67.50
    // neto = 750-97.50 = 652.50
    const r = calcularPlanillaGeneral(datosBase({ diasTrabajados: 15 }));

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(750.00, 2);
    expect(r.ingresos.totalIngresos).toBeCloseTo(750.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(97.50, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(67.50, 2);
    expect(r.netoPagar).toBeCloseTo(652.50, 2);
  });

  it('retorna todo en cero para trabajador con cero días trabajados', () => {
    const r = calcularPlanillaGeneral(datosBase({ diasTrabajados: 0 }));

    expect(r.ingresos.totalIngresos).toBeCloseTo(0.00, 2);
    expect(r.descuentos.totalDescuentos).toBeCloseTo(0.00, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(0.00, 2);
    expect(r.netoPagar).toBeCloseTo(0.00, 2);
  });
});

describe('calcularPlanillaGeneral - piso RMV en EsSalud (Ley 26790 art. 6 mod. Ley 28791)', () => {
  it('trabajador tiempo completo con sueldo sobre la RMV no aplica piso', () => {
    // remuneracionBruta = 1500 > piso(1130×30/30=1130) → base = 1500
    // EsSalud = round2(1500×0.09) = 135
    const r = calcularPlanillaGeneral(datosBase({ remuneracionBase: 1500 }));
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
  });

  it('trabajador tiempo completo con sueldo bajo la RMV aplica piso proporcional', () => {
    // remuneracionBruta = 800 < piso(1130×30/30=1130) → base = 1130
    // EsSalud = round2(1130×0.09) = round2(101.70) = 101.70
    const r = calcularPlanillaGeneral(datosBase({ remuneracionBase: 800 }));
    expect(r.aportesEmpleador.essalud).toBeCloseTo(101.70, 2);
  });

  it('trabajador tiempo completo, 15 días trabajados, sueldo bajo RMV → piso proporcional', () => {
    // remuneracionBruta = round2(800/30×15) = 400
    // piso = round2(1130×15/30) = 565 → base = 565
    // EsSalud = round2(565×0.09) = round2(50.85) = 50.85
    const r = calcularPlanillaGeneral(datosBase({ remuneracionBase: 800, diasTrabajados: 15 }));
    expect(r.aportesEmpleador.essalud).toBeCloseTo(50.85, 2);
  });

  it('trabajador tiempo parcial no aplica piso aunque sueldo esté bajo la RMV', () => {
    // D.S. 001-96-TR — tiempo parcial cotiza sobre remuneración real sin piso
    // EsSalud = round2(600×0.09) = 54
    const r = calcularPlanillaGeneral(datosBase({ remuneracionBase: 600, esTiempoParcial: true }));
    expect(r.aportesEmpleador.essalud).toBeCloseTo(54.00, 2);
  });
});
