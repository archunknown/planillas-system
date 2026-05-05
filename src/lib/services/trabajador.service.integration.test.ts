import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as TrabajadorService from './trabajador.service';
import { ServiceError } from '@/lib/errors/service-error';

let _seq = 0;
function ns() {
  return String(++_seq).padStart(6, '0');
}

function dniTest() {
  const seq = ns();
  return seq.padStart(8, '9');
}

let createdEmpresaIds: string[];
let createdTrabajadorIds: string[];

beforeEach(() => {
  createdEmpresaIds = [];
  createdTrabajadorIds = [];
});

afterEach(async () => {
  // FK: hijo → trabajador → empresa
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
      ruc: `20${seq.padEnd(9, '0')}`,
      razonSocial: `Empresa Test ${seq}`,
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

async function crearTrabajadorBase(
  empresaId: string,
  overrides: Partial<TrabajadorService.CrearTrabajadorInput> = {},
) {
  const t = await TrabajadorService.crear({
    empresaId,
    dni: dniTest(),
    apellidoPaterno: 'García',
    apellidoMaterno: 'López',
    nombres: 'Juan',
    fechaNacimiento: new Date('1990-06-15'),
    sexo: 'M',
    ...overrides,
  });
  createdTrabajadorIds.push(t.id);
  return t;
}

describe('trabajador.service — integración E2E', () => {

  describe('crear', () => {
    it('crea trabajador mínimo sin hijos', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      expect(t.id).toBeTruthy();
      expect(t.empresaId).toBe(e.id);
      expect(t.eliminadoEn).toBeNull();
    });

    it('lanza DUPLICATE si mismo DNI en misma empresa', async () => {
      const e = await crearEmpresaBase();
      const dni = dniTest();
      await crearTrabajadorBase(e.id, { dni });
      await expect(crearTrabajadorBase(e.id, { dni })).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'DUPLICATE',
      );
    });

    it('permite mismo DNI en empresa distinta', async () => {
      const e1 = await crearEmpresaBase();
      const e2 = await crearEmpresaBase();
      const dni = dniTest();
      const t1 = await crearTrabajadorBase(e1.id, { dni });
      const t2 = await crearTrabajadorBase(e2.id, { dni });
      expect(t1.id).not.toBe(t2.id);
      expect(t1.dni).toBe(t2.dni);
    });

    it('lanza FOREIGN_KEY_VIOLATION si empresaId no existe', async () => {
      await expect(
        crearTrabajadorBase('empresa-inexistente'),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'FOREIGN_KEY_VIOLATION',
      );
    });

    it('lanza FOREIGN_KEY_VIOLATION si empresa está eliminada', async () => {
      const e = await crearEmpresaBase();
      await prisma.empresa.update({ where: { id: e.id }, data: { eliminadoEn: new Date() } });
      await expect(crearTrabajadorBase(e.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'FOREIGN_KEY_VIOLATION',
      );
    });
  });

  describe('crearConHijos (transacción)', () => {
    it('crea trabajador con hijos en una transacción', async () => {
      const e = await crearEmpresaBase();
      const resultado = await TrabajadorService.crearConHijos({
        trabajador: {
          empresaId: e.id,
          dni: dniTest(),
          apellidoPaterno: 'Pérez',
          apellidoMaterno: 'Ríos',
          nombres: 'María',
          fechaNacimiento: new Date('1985-03-10'),
          sexo: 'F',
        },
        hijos: [
          { nombres: 'Hijo Uno', fechaNacimiento: new Date('2010-01-01') },
          { nombres: 'Hijo Dos', fechaNacimiento: new Date('2013-05-20') },
        ],
      });
      createdTrabajadorIds.push(resultado.id);
      expect(resultado.hijos).toHaveLength(2);
      expect(resultado.hijos[0].trabajadorId).toBe(resultado.id);
    });

    it('rollback si empresa no existe — trabajador y hijos no persisten', async () => {
      const dni = dniTest();
      await expect(
        TrabajadorService.crearConHijos({
          trabajador: {
            empresaId: 'no-existe',
            dni,
            apellidoPaterno: 'Test',
            apellidoMaterno: 'Test',
            nombres: 'Test',
            fechaNacimiento: new Date('1990-01-01'),
            sexo: 'M',
          },
          hijos: [{ nombres: 'Hijo Test', fechaNacimiento: new Date('2015-01-01') }],
        }),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'FOREIGN_KEY_VIOLATION',
      );
      const count = await prisma.trabajador.count({ where: { dni } });
      expect(count).toBe(0);
    });
  });

  describe('obtenerPorId', () => {
    it('retorna el trabajador si existe', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const found = await TrabajadorService.obtenerPorId(t.id);
      expect(found.id).toBe(t.id);
    });

    it('lanza NOT_FOUND si id no existe', async () => {
      await expect(TrabajadorService.obtenerPorId('id-fantasma')).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });

    it('lanza NOT_FOUND si está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await TrabajadorService.eliminar(t.id);
      await expect(TrabajadorService.obtenerPorId(t.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('obtenerPorDniEmpresa', () => {
    it('retorna el trabajador si existe', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const found = await TrabajadorService.obtenerPorDniEmpresa(t.dni, e.id);
      expect(found.id).toBe(t.id);
    });

    it('lanza NOT_FOUND si DNI no existe en la empresa', async () => {
      const e = await crearEmpresaBase();
      await expect(TrabajadorService.obtenerPorDniEmpresa('99999999', e.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('listarPorEmpresa', () => {
    it('lista solo no eliminados por defecto', async () => {
      const e = await crearEmpresaBase();
      const t1 = await crearTrabajadorBase(e.id);
      const t2 = await crearTrabajadorBase(e.id);
      await TrabajadorService.eliminar(t2.id);

      const { datos } = await TrabajadorService.listarPorEmpresa(e.id);
      const ids = datos.map((t) => t.id);
      expect(ids).toContain(t1.id);
      expect(ids).not.toContain(t2.id);
    });

    it('incluirEliminados=true muestra todos', async () => {
      const e = await crearEmpresaBase();
      const t1 = await crearTrabajadorBase(e.id);
      const t2 = await crearTrabajadorBase(e.id);
      await TrabajadorService.eliminar(t2.id);

      const { datos } = await TrabajadorService.listarPorEmpresa(e.id, { incluirEliminados: true });
      const ids = datos.map((t) => t.id);
      expect(ids).toContain(t1.id);
      expect(ids).toContain(t2.id);
    });

    it('no mezcla trabajadores de distintas empresas', async () => {
      const e1 = await crearEmpresaBase();
      const e2 = await crearEmpresaBase();
      const t1 = await crearTrabajadorBase(e1.id);
      const t2 = await crearTrabajadorBase(e2.id);

      const { datos } = await TrabajadorService.listarPorEmpresa(e1.id);
      const ids = datos.map((t) => t.id);
      expect(ids).toContain(t1.id);
      expect(ids).not.toContain(t2.id);
    });
  });

  describe('actualizar', () => {
    it('actualiza campos parciales', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const actualizado = await TrabajadorService.actualizar(t.id, { nombres: 'Pedro Actualizado' });
      expect(actualizado.nombres).toBe('Pedro Actualizado');
      expect(actualizado.dni).toBe(t.dni);
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(
        TrabajadorService.actualizar('id-fantasma', { nombres: 'X' }),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });

  describe('eliminar + restaurar (soft delete)', () => {
    it('elimina suavemente y desaparece del listado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const eliminado = await TrabajadorService.eliminar(t.id);
      expect(eliminado.eliminadoEn).not.toBeNull();

      const { datos } = await TrabajadorService.listarPorEmpresa(e.id);
      expect(datos.map((x) => x.id)).not.toContain(t.id);
    });

    it('lanza INVALID_STATE si ya está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await TrabajadorService.eliminar(t.id);
      await expect(TrabajadorService.eliminar(t.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });

    it('restaura el trabajador eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await TrabajadorService.eliminar(t.id);
      const restaurado = await TrabajadorService.restaurar(t.id);
      expect(restaurado.eliminadoEn).toBeNull();
    });

    it('lanza INVALID_STATE al restaurar si no está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await expect(TrabajadorService.restaurar(t.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });
  });

  describe('sub-CRUD Hijo', () => {
    it('agregarHijo crea hijo asociado al trabajador', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const hijo = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Lucía',
        fechaNacimiento: new Date('2012-07-04'),
      });
      expect(hijo.trabajadorId).toBe(t.id);
      expect(hijo.eliminadoEn).toBeNull();
    });

    it('agregarHijo lanza NOT_FOUND si trabajador no existe', async () => {
      await expect(
        TrabajadorService.agregarHijo('id-fantasma', {
          nombres: 'Test',
          fechaNacimiento: new Date('2010-01-01'),
        }),
      ).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });

    it('actualizarHijo cambia campos correctamente', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const hijo = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Nombre Inicial',
        fechaNacimiento: new Date('2012-07-04'),
      });
      const actualizado = await TrabajadorService.actualizarHijo(hijo.id, { nombres: 'Nombre Nuevo' });
      expect(actualizado.nombres).toBe('Nombre Nuevo');
    });

    it('eliminarHijo hace soft delete', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const hijo = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Hijo para eliminar',
        fechaNacimiento: new Date('2015-03-01'),
      });
      const eliminado = await TrabajadorService.eliminarHijo(hijo.id);
      expect(eliminado.eliminadoEn).not.toBeNull();

      const hijos = await TrabajadorService.listarHijos(t.id);
      expect(hijos.map((h) => h.id)).not.toContain(hijo.id);
    });

    it('eliminarHijo lanza INVALID_STATE si ya está eliminado', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const hijo = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Doble eliminar',
        fechaNacimiento: new Date('2015-03-01'),
      });
      await TrabajadorService.eliminarHijo(hijo.id);
      await expect(TrabajadorService.eliminarHijo(hijo.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'INVALID_STATE',
      );
    });

    it('listarHijos incluirEliminados=true muestra todos', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      const h1 = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Activo',
        fechaNacimiento: new Date('2010-01-01'),
      });
      const h2 = await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Eliminado',
        fechaNacimiento: new Date('2012-01-01'),
      });
      await TrabajadorService.eliminarHijo(h2.id);

      const todos = await TrabajadorService.listarHijos(t.id, { incluirEliminados: true });
      const ids = todos.map((h) => h.id);
      expect(ids).toContain(h1.id);
      expect(ids).toContain(h2.id);

      const soloActivos = await TrabajadorService.listarHijos(t.id);
      expect(soloActivos.map((h) => h.id)).toContain(h1.id);
      expect(soloActivos.map((h) => h.id)).not.toContain(h2.id);
    });

    it('hijos de trabajador eliminado quedan con FK pero ocultos por filtro', async () => {
      const e = await crearEmpresaBase();
      const t = await crearTrabajadorBase(e.id);
      await TrabajadorService.agregarHijo(t.id, {
        nombres: 'Hijo de eliminado',
        fechaNacimiento: new Date('2010-01-01'),
      });
      await TrabajadorService.eliminar(t.id);

      // El hijo sigue existiendo en DB (FK intacta), pero el trabajador es inaccesible via obtenerPorId
      const hijos = await prisma.hijo.findMany({ where: { trabajadorId: t.id } });
      expect(hijos).toHaveLength(1);

      await expect(TrabajadorService.obtenerPorId(t.id)).rejects.toSatisfy(
        (err: ServiceError) => err instanceof ServiceError && err.code === 'NOT_FOUND',
      );
    });
  });
});
