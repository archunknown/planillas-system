import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  calcular,
  anular,
  obtenerPorId,
  obtenerPorContrato,
  listarPorEmpresa,
} from './liquidacion.service';
import { ServiceError } from '@/lib/errors/service-error';

// Prefijo RUC único para este módulo (evita colisiones con tests paralelos)
let _seq = 0;
function ns() { return String(++_seq).padStart(6, '0'); }

let cleanupIds: { contratoIds: string[]; trabajadorIds: string[]; empresaIds: string[] };

beforeEach(() => {
  cleanupIds = { contratoIds: [], trabajadorIds: [], empresaIds: [] };
});

afterEach(async () => {
  await prisma.liquidacion.deleteMany({ where: { contratoId: { in: cleanupIds.contratoIds } } });
  await prisma.contrato.deleteMany({ where: { id: { in: cleanupIds.contratoIds } } });
  await prisma.hijo.deleteMany({ where: { trabajadorId: { in: cleanupIds.trabajadorIds } } });
  await prisma.trabajador.deleteMany({ where: { id: { in: cleanupIds.trabajadorIds } } });
  await prisma.empresa.deleteMany({ where: { id: { in: cleanupIds.empresaIds } } });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function crearEmpresa() {
  const s = ns();
  const e = await prisma.empresa.create({
    data: {
      ruc: `20880${s}`,
      razonSocial: 'LiqTest SA',
      tipoEmpresa: 'SAC',
      direccion: 'Av. Test 1',
      distrito: 'Lima',
      provincia: 'Lima',
      departamento: 'Lima',
    },
  });
  cleanupIds.empresaIds.push(e.id);
  return e;
}

async function crearTrabajador(empresaId: string) {
  const s = ns();
  const t = await prisma.trabajador.create({
    data: {
      empresaId,
      dni: `L${s}`,
      apellidoPaterno: 'Test',
      apellidoMaterno: 'Test',
      nombres: 'Trabajador',
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
  overrides: Record<string, unknown> = {},
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

const FECHA_CESE = new Date(Date.UTC(2026, 5, 15)); // 15 jun 2026
const MOTIVO_CESE = 'Renuncia voluntaria del trabajador.';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('liquidacion.service — integración E2E', () => {

  // L1: Happy path — cálculo correcto, contrato inactivado con fechaFin y motivoCese
  it('L1 calcular: ctsTrunca=187.50, totalNeto=2250.00, contrato.activo=false + fechaFin + motivoCese', async () => {
    // Mirror de T8 en planilla.service.integration.test.ts.
    // CTS: May1→Jun15 = 1m+15d → (1500/12)×1+(1500/360)×15 = 125+62.50=187.50
    // Gratif trunca: ene-jun → 5m+15d → 1375.00
    // Vac truncas: 5m+15d desde ene → 687.50
    // totalNeto = 187.50+1375.00+687.50 = 2250.00
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    const liq = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });

    expect(liq.ctsTrunca.toNumber()).toBeCloseTo(187.50, 2);
    expect(liq.gratificacionTrunca.toNumber()).toBeCloseTo(1375.00, 2);
    expect(liq.vacacionesTruncas.toNumber()).toBeCloseTo(687.50, 2);
    expect(liq.totalNeto.toNumber()).toBeCloseTo(2250.00, 2);
    expect(liq.anulada).toBe(false);

    const contratoActualizado = await prisma.contrato.findUniqueOrThrow({ where: { id: c.id } });
    expect(contratoActualizado.activo).toBe(false);
    expect(contratoActualizado.fechaFin?.toISOString()).toBe(FECHA_CESE.toISOString());
    expect(contratoActualizado.motivoCese).toBe(MOTIVO_CESE);
  });

  // L2: Vigente bloquea recalcular
  it('L2 calcular con vigente existente → INVALID_STATE', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });

    await expect(
      calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'INVALID_STATE',
    );
  });

  // L3: Anular reactiva contrato; recalcular con nueva fecha crea nueva liquidación
  it('L3 anular revierte contrato (activo=true, fechaFin=null); recalcular crea nueva liq', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    const liq1 = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });

    // anular() debe revertir el contrato automáticamente (H2)
    await anular(liq1.id, { motivoAnulacion: 'Corrección de fecha de cese requerida.' });

    const contratoTrasAnulacion = await prisma.contrato.findUniqueOrThrow({ where: { id: c.id } });
    expect(contratoTrasAnulacion.activo).toBe(true);
    expect(contratoTrasAnulacion.fechaFin).toBeNull();
    expect(contratoTrasAnulacion.motivoCese).toBeNull();

    // Recalcular con nueva fecha — no requiere intervención manual
    const nuevaFecha = new Date(Date.UTC(2026, 6, 31)); // 31 jul 2026
    const liq2 = await calcular({ contratoId: c.id, fechaCese: nuevaFecha, motivoCese: 'Fecha corregida.' });

    expect(liq2.id).not.toBe(liq1.id);
    expect(liq2.anulada).toBe(false);

    const contratoTrasRecalculo = await prisma.contrato.findUniqueOrThrow({ where: { id: c.id } });
    expect(contratoTrasRecalculo.activo).toBe(false);
    expect(contratoTrasRecalculo.fechaFin?.toISOString()).toBe(nuevaFecha.toISOString());
  });

  // L4: fechaCese anterior a fechaInicio
  it('L4 fechaCese < fechaInicio → INVALID_STATE', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id); // fechaInicio = 2026-01-01

    const fechaAnterior = new Date(Date.UTC(2025, 11, 31)); // 31 dic 2025
    await expect(
      calcular({ contratoId: c.id, fechaCese: fechaAnterior, motivoCese: MOTIVO_CESE }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'INVALID_STATE',
    );
  });

  // L5: Contrato inexistente → NOT_FOUND
  it('L5 calcular con contratoId inexistente → NOT_FOUND', async () => {
    await expect(
      calcular({ contratoId: 'no-existe', fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'NOT_FOUND',
    );
  });

  // L6: Contrato soft-deleted → INVALID_STATE
  it('L6 calcular con contrato eliminado → INVALID_STATE', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);
    await prisma.contrato.update({ where: { id: c.id }, data: { eliminadoEn: new Date() } });

    await expect(
      calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'INVALID_STATE',
    );
  });

  // L7: obtenerPorContrato
  it('L7 obtenerPorContrato: retorna vigente; oculta anulada; incluirAnuladas=true la retorna', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    const liq = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });

    // Vigente visible
    const vigente = await obtenerPorContrato(c.id);
    expect(vigente).not.toBeNull();
    expect(vigente!.id).toBe(liq.id);

    // Anular y verificar que ya no se retorna como vigente
    await anular(liq.id, { motivoAnulacion: 'Test anulación para obtenerPorContrato.' });
    const postAnulacion = await obtenerPorContrato(c.id);
    expect(postAnulacion).toBeNull();

    // Con incluirAnuladas=true, sí aparece
    const conAnuladas = await obtenerPorContrato(c.id, { incluirAnuladas: true });
    expect(conAnuladas).not.toBeNull();
    expect(conAnuladas!.id).toBe(liq.id);
  });

  // L8: listarPorEmpresa — paginación y filtro por fecha
  it('L8 listarPorEmpresa: paginación y filtro fechaCeseDesde/Hasta', async () => {
    const e = await crearEmpresa();

    // Crear dos contratos con distintas fechas de cese
    const t1 = await crearTrabajador(e.id);
    const c1 = await crearContrato(t1.id, e.id);
    await calcular({ contratoId: c1.id, fechaCese: new Date(Date.UTC(2026, 2, 31)), motivoCese: MOTIVO_CESE });

    const t2 = await crearTrabajador(e.id);
    const c2 = await crearContrato(t2.id, e.id);
    await calcular({ contratoId: c2.id, fechaCese: new Date(Date.UTC(2026, 5, 30)), motivoCese: MOTIVO_CESE });

    // Sin filtro → ambas
    const { datos: todas, total } = await listarPorEmpresa(e.id);
    expect(total).toBe(2);
    expect(todas.length).toBe(2);

    // Filtro: solo las del segundo semestre (gte jun)
    const { datos: filtradas, total: totalFiltrado } = await listarPorEmpresa(e.id, {
      fechaCeseDesde: new Date(Date.UTC(2026, 5, 1)),
    });
    expect(totalFiltrado).toBe(1);
    expect(filtradas[0].contratoId).toBe(c2.id);
  });

  // L9: anular happy path — liquidación anulada + contrato reactivado (H2)
  it('L9 anular: liquidacion.anulada=true; contrato.activo=true, fechaFin=null, motivoCese=null', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    const liq = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });
    const anulada = await anular(liq.id, { motivoAnulacion: 'Motivo válido de anulación.' });

    expect(anulada.anulada).toBe(true);
    expect(anulada.anuladaEn).toBeInstanceOf(Date);
    expect(anulada.motivoAnulacion).toBe('Motivo válido de anulación.');

    const contratoTrasAnulacion = await prisma.contrato.findUniqueOrThrow({ where: { id: c.id } });
    expect(contratoTrasAnulacion.activo).toBe(true);
    expect(contratoTrasAnulacion.fechaFin).toBeNull();
    expect(contratoTrasAnulacion.motivoCese).toBeNull();
  });

  // L10: Double anular → INVALID_STATE
  it('L10 anular dos veces la misma liquidación → INVALID_STATE', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);

    const liq = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });
    await anular(liq.id, { motivoAnulacion: 'Primera anulación, auditoría interna.' });

    await expect(
      anular(liq.id, { motivoAnulacion: 'Segunda anulación no permitida.' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'INVALID_STATE',
    );
  });

  // L11: obtenerPorId happy path
  it('L11 obtenerPorId retorna liquidación existente', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    const c = await crearContrato(t.id, e.id);
    const liq = await calcular({ contratoId: c.id, fechaCese: FECHA_CESE, motivoCese: MOTIVO_CESE });

    const found = await obtenerPorId(liq.id);
    expect(found.id).toBe(liq.id);
  });

  // L12: obtenerPorId NOT_FOUND
  it('L12 obtenerPorId con id inexistente → NOT_FOUND', async () => {
    await expect(obtenerPorId('no-existe')).rejects.toSatisfy(
      (err: unknown) => err instanceof ServiceError && err.code === 'NOT_FOUND',
    );
  });
});

// L-STATIC: sin export 'restaurar'
it('L-STATIC: no existe export restaurar en liquidacion.service', async () => {
  const mod = await import('./liquidacion.service');
  expect((mod as Record<string, unknown>).restaurar).toBeUndefined();
});
