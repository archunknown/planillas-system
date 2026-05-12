import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  abrirPeriodo,
  listarPeriodos,
  obtenerPeriodoConDetalles,
  actualizarInputsDetalle,
  calcularPeriodo,
  cerrarPeriodo,
} from './periodo.service';
import { ServiceError } from '@/lib/errors/service-error';

const MES = 3;
const ANIO = 2098;

let _seq = 0;
function ns() {
  return String(++_seq).padStart(6, '0');
}

let cleanupIds: { contratoIds: string[]; trabajadorIds: string[]; empresaIds: string[] };

beforeEach(() => {
  cleanupIds = { contratoIds: [], trabajadorIds: [], empresaIds: [] };
});

afterEach(async () => {
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

async function crearEmpresa() {
  const s = ns();
  const e = await prisma.empresa.create({
    data: {
      ruc: `20980${s}`,
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

async function crearTrabajador(empresaId: string) {
  const s = ns();
  const t = await prisma.trabajador.create({
    data: {
      empresaId,
      dni: `P${s}`,
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

async function crearContrato(trabajadorId: string, empresaId: string) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
  cleanupIds.contratoIds.push(c.id);
  return c;
}

describe('periodo.service — integración E2E', () => {
  // ─── abrirPeriodo ─────────────────────────────────────────────────────────

  it('PI1 abrirPeriodo crea Periodo ABIERTO y stubs para contratos activos', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);

    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });

    expect(periodo.estado).toBe('ABIERTO');
    expect(periodo.empresaId).toBe(e.id);
    expect(periodo.mes).toBe(MES);
    expect(periodo.anio).toBe(ANIO);

    const stubs = await prisma.planillaDetalle.findMany({ where: { periodoId: periodo.id } });
    expect(stubs).toHaveLength(1);
    expect(stubs[0].netoPagar.toNumber()).toBe(0);
  });

  it('PI2 abrirPeriodo es idempotente — segunda llamada retorna el mismo periodo sin duplicar stubs', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);

    const p1 = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });
    const p2 = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });

    expect(p1.id).toBe(p2.id);
    const count = await prisma.planillaDetalle.count({ where: { periodoId: p1.id } });
    expect(count).toBe(1);
  });

  it('PI3 abrirPeriodo lanza DUPLICATE si el periodo ya está CERRADO', async () => {
    const e = await crearEmpresa();
    await prisma.periodo.create({
      data: { empresaId: e.id, mes: MES, anio: ANIO, estado: 'CERRADO' },
    });

    await expect(abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO }))
      .rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('PI4 dos empresas pueden tener el mismo mes/año con estados independientes', async () => {
    const e1 = await crearEmpresa();
    const e2 = await crearEmpresa();

    const p1 = await abrirPeriodo({ empresaId: e1.id, mes: MES, anio: ANIO });
    const p2 = await abrirPeriodo({ empresaId: e2.id, mes: MES, anio: ANIO });

    expect(p1.id).not.toBe(p2.id);
    expect(p1.empresaId).toBe(e1.id);
    expect(p2.empresaId).toBe(e2.id);
  });

  // ─── listarPeriodos ───────────────────────────────────────────────────────

  it('PI5 listarPeriodos retorna solo periodos de la empresa solicitada', async () => {
    const e1 = await crearEmpresa();
    const e2 = await crearEmpresa();
    await abrirPeriodo({ empresaId: e1.id, mes: MES, anio: ANIO });
    await abrirPeriodo({ empresaId: e2.id, mes: MES, anio: ANIO });

    const resultado = await listarPeriodos({ empresaId: e1.id });

    expect(resultado.total).toBe(1);
    expect(resultado.items[0].empresaId).toBe(e1.id);
  });

  it('PI6 listarPeriodos filtra por estado', async () => {
    const e = await crearEmpresa();
    await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });
    await abrirPeriodo({ empresaId: e.id, mes: MES + 1, anio: ANIO });

    const abiertos = await listarPeriodos({ empresaId: e.id, estado: 'ABIERTO' });
    expect(abiertos.total).toBe(2);

    const cerrados = await listarPeriodos({ empresaId: e.id, estado: 'CERRADO' });
    expect(cerrados.total).toBe(0);
  });

  // ─── obtenerPeriodoConDetalles ────────────────────────────────────────────

  it('PI7 obtenerPeriodoConDetalles incluye detalles con contrato y trabajador', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });

    const resultado = await obtenerPeriodoConDetalles(periodo.id);

    expect(resultado.detalles).toHaveLength(1);
    expect(resultado.detalles[0].contrato.trabajador.id).toBe(t.id);
  });

  it('PI8 obtenerPeriodoConDetalles lanza NOT_FOUND para id inexistente', async () => {
    await expect(obtenerPeriodoConDetalles('clxxxxxxxxxxxxxxxxxxxxxxxxx'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  // ─── actualizarInputsDetalle ──────────────────────────────────────────────

  it('PI9 actualizarInputsDetalle actualiza diasTrabajados y minutosAtraso', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });
    const detalle = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    const actualizado = await actualizarInputsDetalle(detalle.id, {
      diasTrabajados: 25,
      minutosAtraso: 30,
      faltas: 1,
    });

    expect(actualizado.diasTrabajados).toBe(25);
    expect(actualizado.minutosAtraso).toBe(30);
    expect(actualizado.faltas).toBe(1);
  });

  it('PI10 actualizarInputsDetalle lanza INVALID_STATE si el periodo no está ABIERTO', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });
    // Cambiar estado manualmente a CALCULADO para la prueba
    await prisma.periodo.update({ where: { id: periodo.id }, data: { estado: 'CALCULADO' } });
    const detalle = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });

    await expect(actualizarInputsDetalle(detalle.id, { diasTrabajados: 20 }))
      .rejects.toMatchObject({ code: 'INVALID_STATE' });
  });

  // ─── calcularPeriodo ──────────────────────────────────────────────────────

  it('PI11 calcularPeriodo ejecuta el motor y deja el periodo en CALCULADO', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });

    const resultado = await calcularPeriodo(periodo.id);

    expect(resultado.estado).toBe('CALCULADO');
    const detalle = await prisma.planillaDetalle.findFirstOrThrow({ where: { periodoId: periodo.id } });
    expect(detalle.netoPagar.toNumber()).toBeGreaterThan(0);
  });

  it('PI12 calcularPeriodo lanza NOT_FOUND para id inexistente', async () => {
    await expect(calcularPeriodo('clxxxxxxxxxxxxxxxxxxxxxxxxx'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  // ─── cerrarPeriodo ────────────────────────────────────────────────────────

  it('PI13 cerrarPeriodo cierra el periodo correctamente tras calcular', async () => {
    const e = await crearEmpresa();
    const t = await crearTrabajador(e.id);
    await crearContrato(t.id, e.id);
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });
    await calcularPeriodo(periodo.id);

    const cerrado = await cerrarPeriodo(periodo.id);

    expect(cerrado.estado).toBe('CERRADO');
  });

  it('PI14 cerrarPeriodo lanza INVALID_STATE si el periodo está ABIERTO', async () => {
    const e = await crearEmpresa();
    const periodo = await abrirPeriodo({ empresaId: e.id, mes: MES, anio: ANIO });

    await expect(cerrarPeriodo(periodo.id))
      .rejects.toMatchObject({ code: 'INVALID_STATE' });
  });

  it('PI15 cerrarPeriodo lanza NOT_FOUND para id inexistente', async () => {
    await expect(cerrarPeriodo('clxxxxxxxxxxxxxxxxxxxxxxxxx'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
