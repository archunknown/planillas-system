import { describe, it, expect } from 'vitest';
import { calcularPlanilla, obtenerConfigRegimen } from './index';
import type { DatosPeriodoInput } from './regimenes/types';

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

describe('calcularPlanilla - delegación al régimen GENERAL', () => {
  it('delega a calcularPlanillaGeneral y retorna resultado correcto', () => {
    // Mismo caso base que general.test.ts: ONP 195, EsSalud 135, neto 1305
    const r = calcularPlanilla({ regimen: 'GENERAL', datos: datosBase() });

    expect(r.ingresos.totalIngresos).toBeCloseTo(1500.00, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(195.00, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
    expect(r.netoPagar).toBeCloseTo(1305.00, 2);
  });
});

describe('calcularPlanilla - delegación al régimen MYPE_MICRO', () => {
  it('aplica cuota SIS S/15 en vez de EsSalud proporcional', () => {
    const r = calcularPlanilla({
      regimen: 'MYPE_MICRO',
      datos: datosBase({ remuneracionBase: 1130 }),
    });

    expect(r.aportesEmpleador.essalud).toBeCloseTo(15.00, 2);
    expect(r.netoPagar).toBeCloseTo(983.10, 2);
  });
});

describe('calcularPlanilla - delegación al régimen MYPE_PEQUENA', () => {
  it('aplica EsSalud 9% proporcional y produce resultado diferente al de MYPE_MICRO', () => {
    const r = calcularPlanilla({ regimen: 'MYPE_PEQUENA', datos: datosBase() });

    // EsSalud debe ser 9% proporcional, no S/15
    expect(r.aportesEmpleador.essalud).toBeCloseTo(135.00, 2);
    expect(r.netoPagar).toBeCloseTo(1305.00, 2);
  });
});

describe('calcularPlanilla - delegación al régimen CONSTRUCCION_CIVIL', () => {
  it('lanza Error cuando datosConstruccionCivil no se proporciona', () => {
    expect(() =>
      calcularPlanilla({ regimen: 'CONSTRUCCION_CIVIL', datos: datosBase() })
    ).toThrow('datosConstruccionCivil es requerido');
  });

  it('calcula jornal diario correctamente cuando se proporcionan datosConstruccionCivil', () => {
    // Operario 85.10/día × 26 días = 2212.60; ONP = 287.64; neto = 1924.96
    const r = calcularPlanilla({
      regimen: 'CONSTRUCCION_CIVIL',
      datos: datosBase({
        diasTrabajados: 26,
        remuneracionMensualProyectada: 2500,
        gratificacionesAnualesProyectadas: 5000,
      }),
      datosConstruccionCivil: {
        jornalDiario: 85.10,
        categoriaCC: 'OPERARIO',
        porcentajeBuc: 0,
        movilidadDiaria: 0,
        trabajaEnAltura: false,
      },
    });

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(2212.60, 2);
    expect(r.descuentos.descuentoOnp).toBeCloseTo(287.64, 2);
    expect(r.netoPagar).toBeCloseTo(1924.96, 2);
  });
});

describe('calcularPlanilla - delegación al régimen AGRARIO', () => {
  it('lanza Error cuando remuneracionDiariaAgraria no se proporciona', () => {
    expect(() =>
      calcularPlanilla({ regimen: 'AGRARIO', datos: datosBase() })
    ).toThrow('remuneracionDiariaAgraria es requerido');
  });

  it('calcula remuneración diaria agraria correctamente', () => {
    // 51.25×26 = 1332.50; ONP = 173.23; EsSalud (datos.tasaEssalud=0.06) = 79.95
    // modoPago=SEMESTRAL: remuneracionBasica = jornal×días sin prorrateo
    const r = calcularPlanilla({
      regimen: 'AGRARIO',
      datos: datosBase({
        diasTrabajados: 26,
        tasaEssalud: 0.06,
        remuneracionMensualProyectada: 1400,
        gratificacionesAnualesProyectadas: 2800,
        agrario: { modoPago: 'SEMESTRAL' as const },
      }),
      remuneracionDiariaAgraria: 51.25,
    });

    expect(r.ingresos.remuneracionBasica).toBeCloseTo(1332.50, 2);
    expect(r.aportesEmpleador.essalud).toBeCloseTo(79.95, 2);
    expect(r.netoPagar).toBeCloseTo(1159.27, 2);
  });
});

describe('obtenerConfigRegimen', () => {
  it('retorna config GENERAL con todos los beneficios activos y EsSalud 9%', () => {
    const c = obtenerConfigRegimen('GENERAL');
    expect(c.tieneGratificaciones).toBe(true);
    expect(c.tieneCts).toBe(true);
    expect(c.diasVacaciones).toBe(30);
    expect(c.tasaEssalud).toBeCloseTo(0.09, 4);
    expect(c.asignacionFamiliarObligatoria).toBe(true);
  });

  it('retorna config MYPE_MICRO sin gratificaciones ni CTS', () => {
    const c = obtenerConfigRegimen('MYPE_MICRO');
    expect(c.tieneGratificaciones).toBe(false);
    expect(c.tieneCts).toBe(false);
    expect(c.diasVacaciones).toBe(15);
  });

  it('retorna config MYPE_PEQUENA con beneficios parciales (15 días vacaciones)', () => {
    const c = obtenerConfigRegimen('MYPE_PEQUENA');
    expect(c.tieneGratificaciones).toBe(true);
    expect(c.tieneCts).toBe(true);
    expect(c.diasVacaciones).toBe(15);
  });

  it('retorna config AGRARIO sin CTS ni gratificaciones con EsSalud 6%', () => {
    const c = obtenerConfigRegimen('AGRARIO');
    expect(c.tieneGratificaciones).toBe(false);
    expect(c.tieneCts).toBe(false);
    expect(c.tasaEssalud).toBeCloseTo(0.06, 4);
  });

  it('retorna config CONSTRUCCION_CIVIL con todos los beneficios completos', () => {
    const c = obtenerConfigRegimen('CONSTRUCCION_CIVIL');
    expect(c.tieneGratificaciones).toBe(true);
    expect(c.tieneCts).toBe(true);
    expect(c.diasVacaciones).toBe(30);
  });
});
