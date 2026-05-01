import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { calcularPlanillaPeriodo } from './planilla.service';
import { calcularGratificacionMypePequena } from '@/lib/calculations/regimenes/mype';

// Año ficticio para no colisionar con datos reales
const MES = 1;
const ANIO = 2099;

// Contador por módulo para RUC / DNI únicos entre tests
let _seq = 0;
function ns() {
  return String(++_seq).padStart(6, '0');
}

// IDs creados en cada test — limpiados en afterEach
let cleanupIds: { contratoIds: string[]; trabajadorIds: string[]; empresaIds: string[] };

beforeEach(() => {
  cleanupIds = { contratoIds: [], trabajadorIds: [], empresaIds: [] };
});

afterEach(async () => {
  // Orden FK: boleta → planillaDetalle → periodo → liquidacion → contrato → hijo → trabajador → empresa
  const periodos = await prisma.periodo.findMany({ where: { anio: ANIO } });
  const pIds = periodos.map((p) => p.id);
  await prisma.boleta.deleteMany({ where: { planillaDetalle: { periodoId: { in: pIds } } } });
  await prisma.planillaDetalle.deleteMany({ where: { periodoId: { in: pIds } } });
  await prisma.periodo.deleteMany({ where: { id: { in: pIds } } });
  await prisma.liquidacion.deleteMany({ where: { contratoId: { in: cleanupIds.contratoIds } } });
  await prisma.contrato.deleteMany({ where: { id: { in: cleanupIds.contratoIds } } });
  await prisma.hijo.deleteMany({ where: { trabajadorId: { in: cleanupIds.trabajadorIds } } });
  await prisma.trabajador.deleteMany({ where: { id: { in: cleanupIds.trabajadorIds } } });
  await prisma.empresa.deleteMany({ where: { id: { in: cleanupIds.empresaIds } } });
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function crearEmpresa() {
  const s = ns();
  const e = await prisma.empresa.create({
    data: {
      ruc: `20990${s}`,
      razonSocial: 'Test SA',
      tipoEmpresa: 'SAC',
      direccion: 'Test 1',
      distrito: 'Lima',
      provincia: 'Lima',
      departamento: 'Lima',
    },
  });
  cleanupIds.empresaIds.push(e.id);
  return e;
}

async function crearTrabajador() {
  const s = ns();
  const t = await prisma.trabajador.create({
    data: {
      dni: `T${s}`,
      apellidoPaterno: 'Test',
      apellidoMaterno: 'Test',
      nombres: 'Test',
      fechaNacimiento: new Date('1990-01-01'),
      sexo: 'M',
    },
  });
  cleanupIds.trabajadorIds.push(t.id);
  return t;
}

async function crearContrato(
  trabajadorId: string,
  empresaId: string,
  overrides: Partial<{
    regimenLaboral: string;
    tipoContrato: string;
    sistemaPensionario: string;
    remuneracionBase: number;
    tieneAsignacionFamiliar: boolean;
    categoriaCC: string;
    zonaBonificacion: string | null;
  }> = {}
) {
  const c = await prisma.contrato.create({
    data: {
      trabajadorId,
      empresaId,
      regimenLaboral: 'GENERAL',
      tipoContrato: 'INDEFINIDO',
      fechaInicio: new Date(Date.UTC(2026, 0, 1)),
      cargo: 'Empleado',
      remuneracionBase: 1500,
      frecuenciaPago: 'MENSUAL',
      sistemaPensionario: 'ONP',
      ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
  cleanupIds.contratoIds.push(c.id);
  return c;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('calcularPlanillaPeriodo — integración E2E', () => {
  // ─── Test 1: GENERAL base ─────────────────────────────────────────────────

  it('T1 GENERAL rem=1500 30d ONP → neto=1305, EsSalud=135, Periodo=CALCULADO', async () => {
    // descuentoOnp = round2(1500×0.13) = 195
    // essalud     = round2(1500×0.09) = 135  (base > RMV, sin piso)
    // neto        = 1500 − 195 = 1305
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    await crearContrato(t.id, e.id);

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(d.totalIngresos.toNumber()).toBeCloseTo(1500, 2);
    expect(d.descuentoOnp.toNumber()).toBeCloseTo(195, 2);
    expect(d.essalud.toNumber()).toBeCloseTo(135, 2);
    expect(d.netoPagar.toNumber()).toBeCloseTo(1305, 2);
    expect(periodo.estado).toBe('CALCULADO');
  });

  // ─── Test 2: EsSalud piso RMV ─────────────────────────────────────────────

  it('T2 GENERAL rem=800 → EsSalud aplica piso RMV: essalud=101.70', async () => {
    // baseEsSalud = max(800, 1130) = 1130  → Ley 26790 art.6
    // essalud     = round2(1130×0.09) = 101.70
    // descuentoOnp = round2(800×0.13) = 104
    // neto        = 800 − 104 = 696
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    await crearContrato(t.id, e.id, { remuneracionBase: 800 });

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(d.essalud.toNumber()).toBeCloseTo(101.70, 2);
    expect(d.netoPagar.toNumber()).toBeCloseTo(696, 2);
  });

  // ─── Test 3: MYPE_PEQUENA AFP + hijo ──────────────────────────────────────

  it('T3 MYPE_PEQUENA AFP Habitat 1 hijo → AF=113, descuentos AFP + gratif 50% correctos', async () => {
    // totalIngresos = 1500 + AF(113) = 1613
    // descuentoAfp  = round2(1613×0.10)   = 161.30
    // comisionAfp   = round2(1613×0.0147) = 23.71
    // primaAfp      = round2(1613×0.0137) = 22.10
    // calcularGratificacionMypePequena(rem=1500, AF=113, 6m, 0.09):
    //   remComp=1613 → gratBase=round2(1613×0.5)=806.50
    //   bonif  =round2(145.17×0.5)=72.59, total=879.09
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    await crearContrato(t.id, e.id, {
      regimenLaboral: 'MYPE_PEQUENA',
      sistemaPensionario: 'AFP_HABITAT',
      tieneAsignacionFamiliar: true,
    });
    await prisma.hijo.create({
      data: { trabajadorId: t.id, nombres: 'Hijo', fechaNacimiento: new Date('2015-01-01') },
    });

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(d.asignacionFamiliar.toNumber()).toBeCloseTo(113, 2);
    expect(d.descuentoAfp.toNumber()).toBeCloseTo(161.30, 2);
    expect(d.comisionAfp.toNumber()).toBeCloseTo(23.71, 2);
    expect(d.primaSeguroAfp.toNumber()).toBeCloseTo(22.10, 2);

    // Gratificación semestral pequeña empresa (verificación directa del módulo)
    const grat = calcularGratificacionMypePequena({
      remuneracionBase: 1500,
      asignacionFamiliar: 113,
      mesesComputables: 6,
      tasaEssalud: 0.09,
    });
    expect(grat.gratificacionBase).toBeCloseTo(806.50, 2);
    expect(grat.bonificacionExtraordinaria).toBeCloseTo(72.58, 2);
    expect(grat.total).toBeCloseTo(879.09, 2);
  });

  // ─── Test 4: CONSTRUCCION_CIVIL 26 días ───────────────────────────────────

  it('T4 CC OPERARIO 26d → remBasica=2321.80, BUC=742.98, movilidad=223.60, neto=2889.96', async () => {
    // jornal=89.30, buc=0.32, movilidad=8.60  (seed)
    // remuneracionBasica = round2(89.30×26)          = 2321.80
    // bonificacionCC     = round2(89.30×0.32×26)     = round2(742.976) = 742.98
    // movilidadCC        = round2(8.60×26)            = 223.60
    // remuneracionBruta  = round2(2321.80+742.98)     = 3064.78
    // totalIngresos      = round2(3064.78+223.60)     = 3288.38
    // descuentoOnp       = round2(3064.78×0.13)       = 398.42
    // essalud            = round2(3064.78×0.09)       = 275.83
    // neto               = round2(3288.38−398.42)     = 2889.96
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    const c = await crearContrato(t.id, e.id, {
      regimenLaboral: 'CONSTRUCCION_CIVIL',
      tipoContrato: 'OBRA_DETERMINADA',
      categoriaCC: 'OPERARIO',
      remuneracionBase: 0,
    });

    // Pre-crear Periodo + stub con diasTrabajados=26
    const periodo = await prisma.periodo.create({ data: { mes: MES, anio: ANIO } });
    await prisma.planillaDetalle.create({
      data: {
        periodoId: periodo.id,
        contratoId: c.id,
        diasTrabajados: 26,
        remuneracionBasica: 0,
        totalIngresos: 0,
        totalDescuentos: 0,
        totalAportesEmpleador: 0,
        netoPagar: 0,
      },
    });

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(d.remuneracionBasica.toNumber()).toBeCloseTo(2321.80, 2);
    expect(d.bonificacionCC.toNumber()).toBeCloseTo(742.98, 2);
    expect(d.movilidadCC.toNumber()).toBeCloseTo(223.60, 2);
    expect(d.descuentoOnp.toNumber()).toBeCloseTo(398.42, 2);
    expect(d.essalud.toNumber()).toBeCloseTo(275.83, 2);
    expect(d.netoPagar.toNumber()).toBeCloseTo(2889.96, 2);
  });

  // ─── Test 5: AGRARIO PRORRATEADO ──────────────────────────────────────────

  it('T5 AGRARIO rem=1500 30d PRORRATEADO → remBasica=1895.70, EsSalud(6%)=113.74', async () => {
    // remuneracionDiariaAgraria = 1500/30 = 50
    // rb             = round2(50×30)             = 1500
    // gratProrrateada = round2(1500×0.1666)      = 249.90
    // ctsProrrateada  = round2(1500×0.0972)      = 145.80
    // remBasica       = round2(1500+249.90+145.80) = 1895.70
    // ONP             = round2(1895.70×0.13)     = 246.44
    // essalud(6%)     = round2(1895.70×0.06)     = 113.74
    // neto            = round2(1895.70−246.44)   = 1649.26
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    await crearContrato(t.id, e.id, {
      regimenLaboral: 'AGRARIO',
      remuneracionBase: 1500,
    });

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(d.remuneracionBasica.toNumber()).toBeCloseTo(1895.70, 2);
    expect(d.essalud.toNumber()).toBeCloseTo(113.74, 2);
    expect(d.descuentoOnp.toNumber()).toBeCloseTo(246.44, 2);
    expect(d.netoPagar.toNumber()).toBeCloseTo(1649.26, 2);
  });

  // ─── Test 6: Múltiples regímenes en un solo periodo ───────────────────────

  it('T6 3 trabajadores (GENERAL + MYPE_PEQUENA + CC) → 3 PlanillaDetalle creados', async () => {
    const e = await crearEmpresa();

    const t1 = await crearTrabajador();
    const t2 = await crearTrabajador();
    const t3 = await crearTrabajador();

    await crearContrato(t1.id, e.id, { regimenLaboral: 'GENERAL' });
    await crearContrato(t2.id, e.id, { regimenLaboral: 'MYPE_PEQUENA' });
    await crearContrato(t3.id, e.id, {
      regimenLaboral: 'CONSTRUCCION_CIVIL',
      tipoContrato: 'OBRA_DETERMINADA',
      categoriaCC: 'PEON',
      remuneracionBase: 0,
    });

    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const count = await prisma.planillaDetalle.count({ where: { periodoId: periodo.id } });

    expect(count).toBe(3);
    expect(periodo.estado).toBe('CALCULADO');
  });

  // ─── Test 7: Idempotencia ─────────────────────────────────────────────────

  it('T7 Idempotencia: segunda llamada actualiza valores sin duplicar registros', async () => {
    // Primera llamada: crea Periodo + PlanillaDetalle
    // Segunda llamada: upsert del Periodo (no-op) + update del PlanillaDetalle existente
    const e = await crearEmpresa();
    const t = await crearTrabajador();
    await crearContrato(t.id, e.id);

    await calcularPlanillaPeriodo(e.id, MES, ANIO);
    await calcularPlanillaPeriodo(e.id, MES, ANIO);

    const periodo = await prisma.periodo.findUniqueOrThrow({
      where: { mes_anio: { mes: MES, anio: ANIO } },
    });
    const count = await prisma.planillaDetalle.count({ where: { periodoId: periodo.id } });
    const d = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    expect(count).toBe(1);
    expect(d.netoPagar.toNumber()).toBeCloseTo(1305, 2);
  });
});
