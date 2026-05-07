import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as ContratoService from './contrato.service';
import { ServiceError } from '@/lib/errors/service-error';

let _seq = 0;
function ns() {
  return String(++_seq).padStart(6, '0');
}

let createdContratoIds: string[];
let createdTrabajadorIds: string[];
let createdEmpresaIds: string[];

beforeEach(() => {
  createdContratoIds = [];
  createdTrabajadorIds = [];
  createdEmpresaIds = [];
});

afterEach(async () => {
  // FK: liquidacion → contrato → trabajador → empresa
  if (createdContratoIds.length > 0) {
    await prisma.liquidacion.deleteMany({ where: { contratoId: { in: createdContratoIds } } });
    await prisma.planillaDetalle.deleteMany({ where: { contratoId: { in: createdContratoIds } } });
    await prisma.contrato.deleteMany({ where: { id: { in: createdContratoIds } } });
  }
  if (createdTrabajadorIds.length > 0) {
    await prisma.hijo.deleteMany({ where: { trabajadorId: { in: createdTrabajadorIds } } });
    await prisma.trabajador.deleteMany({ where: { id: { in: createdTrabajadorIds } } });
  }
  if (createdEmpresaIds.length > 0) {
    await prisma.empresa.deleteMany({ where: { id: { in: createdEmpresaIds } } });
  }
});

async function crearEmpresaBase() {
  const seq = ns();
  const e = await prisma.empresa.create({
    data: {
      ruc: `21${seq.padEnd(9, '1')}`,  // prefijo 21 para no colisionar con otros test files
      razonSocial: `Test Empresa ${seq}`,
      tipoEmpresa: 'SAC',
      direccion: 'Av. Test 1',
      distrito: 'Lima',
      provincia: 'Lima',
      departamento: 'Lima',
    },
  });
  createdEmpresaIds.push(e.id);
  return e;
}

async function crearTrabajadorBase(empresaId: string) {
  const seq = ns();
  const t = await prisma.trabajador.create({
    data: {
      empresaId,
      dni: seq.padStart(8, '9'),
      apellidoPaterno: 'Test',
      apellidoMaterno: 'Test',
      nombres: 'Trabajador Test',
      fechaNacimiento: new Date('1990-01-01'),
      sexo: 'M',
    },
  });
  createdTrabajadorIds.push(t.id);
  return t;
}

async function crearContratoBase(
  trabajadorId: string,
  empresaId: string,
  overrides: Partial<ContratoService.CrearContratoInput> = {},
): Promise<import('@prisma/client').Contrato> {
  const c = await ContratoService.crear({
    trabajadorId,
    empresaId,
    regimenLaboral: 'GENERAL',
    tipoContrato: 'INDEFINIDO',
    fechaInicio: new Date('2026-01-01'),
    cargo: 'Asistente',
    remuneracionBase: 1500,
    frecuenciaPago: 'MENSUAL',
    sistemaPensionario: 'ONP',
    ...overrides,
  });
  createdContratoIds.push(c.id);
  return c;
}

describe('contrato.service — integración E2E', () => {

  describe('crear', () => {
    it('crea contrato simple con activo=true', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      expect(c.activo).toBe(true);
      expect(c.eliminadoEn).toBeNull();
      expect(c.trabajadorId).toBe(t.id);
    });

    it('crear nuevo contrato cierra el previo activo (transacción)', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);

      const c1 = await crearContratoBase(t.id, e.id);
      const c2 = await crearContratoBase(t.id, e.id, { cargo: 'Coordinador' });
      createdContratoIds.push(c1.id, c2.id);

      const previo = await prisma.contrato.findUnique({ where: { id: c1.id } });
      expect(previo!.activo).toBe(false);
      expect(previo!.motivoCese).toBe('Reemplazado por nuevo contrato');
      expect(previo!.fechaFin).not.toBeNull();

      const nuevo = await prisma.contrato.findUnique({ where: { id: c2.id } });
      expect(nuevo!.activo).toBe(true);
    });

    it('lanza NOT_FOUND si trabajador no existe', async () => {
      const e = await crearEmpresaBase();
      await expect(
        crearContratoBase('trabajador-fantasma', e.id),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });

    it('lanza INVALID_STATE si trabajador está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await prisma.trabajador.update({ where: { id: t.id }, data: { eliminadoEn: new Date() } });
      await expect(crearContratoBase(t.id, e.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });

    it('rollback: si la transacción falla el contrato previo queda activo', async () => {
      // Simulamos un fallo forzando un empresaId inválido en el nuevo contrato
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c1 = await crearContratoBase(t.id, e.id);

      await expect(
        ContratoService.crear({
          trabajadorId: t.id,
          empresaId: 'empresa-inexistente-xyz',
          regimenLaboral: 'GENERAL',
          tipoContrato: 'INDEFINIDO',
          fechaInicio: new Date('2026-06-01'),
          cargo: 'Jefe',
          remuneracionBase: 2000,
          frecuenciaPago: 'MENSUAL',
          sistemaPensionario: 'ONP',
        }),
      ).rejects.toThrow();

      // El contrato previo debe seguir activo (rollback)
      const previo = await prisma.contrato.findUnique({ where: { id: c1.id } });
      expect(previo!.activo).toBe(true);
    });
  });

  describe('obtenerPorId', () => {
    it('retorna el contrato si existe', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      const found = await ContratoService.obtenerPorId(c.id);
      expect(found.id).toBe(c.id);
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(ContratoService.obtenerPorId('id-fantasma')).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });

    it('lanza NOT_FOUND si está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await ContratoService.eliminar(c.id);
      await expect(ContratoService.obtenerPorId(c.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('obtenerActivoPorTrabajador', () => {
    it('retorna el contrato activo del trabajador', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      const activo = await ContratoService.obtenerActivoPorTrabajador(t.id);
      expect(activo.id).toBe(c.id);
    });

    it('lanza NOT_FOUND cuando todos los contratos están cerrados', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await ContratoService.cerrarContrato(c.id, { fechaFin: new Date(), motivoCese: 'Renuncia' });
      await expect(ContratoService.obtenerActivoPorTrabajador(t.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('listarPorTrabajador', () => {
    it('lista solo no eliminados por defecto', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c1 = await crearContratoBase(t.id, e.id);
      const c2 = await crearContratoBase(t.id, e.id, { cargo: 'Segundo' });
      await ContratoService.eliminar(c2.id);

      const { datos } = await ContratoService.listarPorTrabajador(t.id);
      const ids = datos.map((x) => x.id);
      expect(ids).toContain(c1.id);
      expect(ids).not.toContain(c2.id);
    });

    it('soloActivos=true filtra correctamente', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c1 = await crearContratoBase(t.id, e.id);
      const c2 = await crearContratoBase(t.id, e.id, { cargo: 'Segundo' });
      // c1 queda inactivo al crear c2

      const { datos } = await ContratoService.listarPorTrabajador(t.id, { soloActivos: true });
      const ids = datos.map((x) => x.id);
      expect(ids).toContain(c2.id);
      expect(ids).not.toContain(c1.id);
    });
  });

  describe('listarPorEmpresa', () => {
    it('lista contratos de la empresa sin mezclar otras', async () => {
      const e1 = await crearEmpresaBase();
      const e2 = await crearEmpresaBase();
      const t1 = await crearTrabajadorBase(e1.id);
      const t2 = await crearTrabajadorBase(e2.id);
      const c1 = await crearContratoBase(t1.id, e1.id);
      const c2 = await crearContratoBase(t2.id, e2.id);

      const { datos } = await ContratoService.listarPorEmpresa(e1.id);
      const ids = datos.map((x) => x.id);
      expect(ids).toContain(c1.id);
      expect(ids).not.toContain(c2.id);
    });
  });

  describe('actualizar', () => {
    it('actualiza campos permitidos', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      const actualizado = await ContratoService.actualizar(c.id, { cargo: 'Coordinador', remuneracionBase: 2000 });
      expect(actualizado.cargo).toBe('Coordinador');
      expect(actualizado.remuneracionBase.toNumber()).toBe(2000);
      // Campos inmutables no cambian
      expect(actualizado.trabajadorId).toBe(t.id);
      expect(actualizado.regimenLaboral).toBe('GENERAL');
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(
        ContratoService.actualizar('id-fantasma', { cargo: 'X' }),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('cerrarContrato', () => {
    it('cierra contrato activo correctamente', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      const cerrado = await ContratoService.cerrarContrato(c.id, {
        fechaFin: new Date('2026-12-31'),
        motivoCese: 'Fin de contrato',
      });
      expect(cerrado.activo).toBe(false);
      expect(cerrado.motivoCese).toBe('Fin de contrato');
    });

    it('lanza INVALID_STATE si ya está cerrado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await ContratoService.cerrarContrato(c.id, { fechaFin: new Date(), motivoCese: 'Primera vez' });
      await expect(
        ContratoService.cerrarContrato(c.id, { fechaFin: new Date(), motivoCese: 'Segunda vez' }),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });
  });

  describe('eliminar + restaurar (soft delete)', () => {
    it('elimina suavemente y desaparece del listado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      const eliminado = await ContratoService.eliminar(c.id);
      expect(eliminado.eliminadoEn).not.toBeNull();

      const { datos } = await ContratoService.listarPorTrabajador(t.id);
      expect(datos.map((x) => x.id)).not.toContain(c.id);
    });

    it('lanza INVALID_STATE si ya está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await ContratoService.eliminar(c.id);
      await expect(ContratoService.eliminar(c.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });

    it('restaura el contrato eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await ContratoService.eliminar(c.id);
      const restaurado = await ContratoService.restaurar(c.id);
      expect(restaurado.eliminadoEn).toBeNull();
    });

    it('lanza NOT_FOUND al restaurar id inexistente', async () => {
      await expect(ContratoService.restaurar('id-fantasma')).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });

    it('lanza INVALID_STATE al restaurar contrato no eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const c = await crearContratoBase(t.id, e.id);
      await expect(ContratoService.restaurar(c.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });
  });
});
