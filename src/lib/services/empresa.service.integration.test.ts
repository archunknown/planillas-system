import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as EmpresaService from './empresa.service';
import { ServiceError } from '@/lib/errors/service-error';

let _seq = 0;
function ns() {
  return String(++_seq).padStart(6, '0');
}

function rucTest() {
  // 11 dígitos: prefijo 20 + 9 dígitos de secuencia (relleno con 9 a la derecha)
  const seq = ns();
  return `20${seq.padEnd(9, '9')}`;
}

let createdIds: string[];

beforeEach(() => {
  createdIds = [];
});

afterEach(async () => {
  if (createdIds.length > 0) {
    await prisma.empresa.deleteMany({ where: { id: { in: createdIds } } });
  }
});

async function crearEmpresaBase(overrides: Partial<EmpresaService.CrearEmpresaInput> = {}) {
  const empresa = await EmpresaService.crear({
    ruc: rucTest(),
    razonSocial: `Test SA ${ns()}`,
    tipoEmpresa: 'SAC',
    direccion: 'Av. Test 1',
    distrito: 'Lima',
    provincia: 'Lima',
    departamento: 'Lima',
    ...overrides,
  });
  createdIds.push(empresa.id);
  return empresa;
}

describe('empresa.service — integración E2E', () => {

  describe('crear', () => {
    it('crea una empresa con campos mínimos', async () => {
      const empresa = await crearEmpresaBase();
      expect(empresa.id).toBeTruthy();
      expect(empresa.activa).toBe(true);
      expect(empresa.eliminadoEn).toBeNull();
    });

    it('lanza DUPLICATE si el RUC ya existe', async () => {
      const ruc = rucTest();
      await crearEmpresaBase({ ruc });
      await expect(crearEmpresaBase({ ruc })).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'DUPLICATE',
      );
    });
  });

  describe('obtenerPorId', () => {
    it('retorna la empresa si existe', async () => {
      const { id } = await crearEmpresaBase();
      const encontrada = await EmpresaService.obtenerPorId(id);
      expect(encontrada.id).toBe(id);
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(EmpresaService.obtenerPorId('id-inexistente')).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });

    it('lanza NOT_FOUND si está eliminada', async () => {
      const empresa = await crearEmpresaBase();
      await EmpresaService.eliminar(empresa.id);
      await expect(EmpresaService.obtenerPorId(empresa.id)).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });
  });

  describe('obtenerPorRuc', () => {
    it('retorna la empresa si existe', async () => {
      const ruc = rucTest();
      await crearEmpresaBase({ ruc });
      const encontrada = await EmpresaService.obtenerPorRuc(ruc);
      expect(encontrada.ruc).toBe(ruc);
    });

    it('lanza NOT_FOUND si el RUC no existe', async () => {
      await expect(EmpresaService.obtenerPorRuc('99999999999')).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });

    it('lanza NOT_FOUND si el RUC está eliminado', async () => {
      const ruc = rucTest();
      const empresa = await crearEmpresaBase({ ruc });
      await EmpresaService.eliminar(empresa.id);
      await expect(EmpresaService.obtenerPorRuc(ruc)).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });
  });

  describe('listar', () => {
    it('retorna solo empresas no eliminadas por defecto', async () => {
      const e1 = await crearEmpresaBase();
      const e2 = await crearEmpresaBase();
      await EmpresaService.eliminar(e2.id);

      const { datos } = await EmpresaService.listar();
      const ids = datos.map((e) => e.id);
      expect(ids).toContain(e1.id);
      expect(ids).not.toContain(e2.id);
    });

    it('incluirEliminados=true muestra todas', async () => {
      const e1 = await crearEmpresaBase();
      const e2 = await crearEmpresaBase();
      await EmpresaService.eliminar(e2.id);

      const { datos } = await EmpresaService.listar({ incluirEliminados: true });
      const ids = datos.map((e) => e.id);
      expect(ids).toContain(e1.id);
      expect(ids).toContain(e2.id);
    });

    it('filtra por soloActivas=false', async () => {
      const activa = await crearEmpresaBase({ activa: true });
      const inactiva = await crearEmpresaBase({ activa: false });

      const { datos } = await EmpresaService.listar({ soloActivas: false });
      const ids = datos.map((e) => e.id);
      expect(ids).toContain(inactiva.id);
      expect(ids).not.toContain(activa.id);
    });

    it('retorna total correcto con paginación', async () => {
      await crearEmpresaBase();
      await crearEmpresaBase();
      await crearEmpresaBase();

      const { total } = await EmpresaService.listar({ porPagina: 1, pagina: 1 });
      expect(total).toBeGreaterThanOrEqual(3);
    });
  });

  describe('actualizar', () => {
    it('actualiza campos parciales', async () => {
      const empresa = await crearEmpresaBase();
      const actualizada = await EmpresaService.actualizar(empresa.id, {
        razonSocial: 'Nombre Actualizado SAC',
      });
      expect(actualizada.razonSocial).toBe('Nombre Actualizado SAC');
      expect(actualizada.ruc).toBe(empresa.ruc);
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(
        EmpresaService.actualizar('id-fantasma', { razonSocial: 'X' }),
      ).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });
  });

  describe('eliminar (soft delete)', () => {
    it('marca eliminadoEn y la empresa deja de aparecer en listados', async () => {
      const empresa = await crearEmpresaBase();
      const eliminada = await EmpresaService.eliminar(empresa.id);
      expect(eliminada.eliminadoEn).not.toBeNull();

      const { datos } = await EmpresaService.listar();
      expect(datos.map((e) => e.id)).not.toContain(empresa.id);
    });

    it('lanza NOT_FOUND si no existe', async () => {
      await expect(EmpresaService.eliminar('id-fantasma')).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });

    it('lanza INVALID_STATE si ya está eliminada', async () => {
      const empresa = await crearEmpresaBase();
      await EmpresaService.eliminar(empresa.id);
      await expect(EmpresaService.eliminar(empresa.id)).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'INVALID_STATE',
      );
    });
  });

  describe('restaurar', () => {
    it('limpia eliminadoEn y la empresa vuelve a listados', async () => {
      const empresa = await crearEmpresaBase();
      await EmpresaService.eliminar(empresa.id);
      const restaurada = await EmpresaService.restaurar(empresa.id);
      expect(restaurada.eliminadoEn).toBeNull();

      const { datos } = await EmpresaService.listar();
      expect(datos.map((e) => e.id)).toContain(empresa.id);
    });

    it('lanza NOT_FOUND si el id no existe', async () => {
      await expect(EmpresaService.restaurar('id-fantasma')).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'NOT_FOUND',
      );
    });

    it('lanza INVALID_STATE si la empresa no está eliminada', async () => {
      const empresa = await crearEmpresaBase();
      await expect(EmpresaService.restaurar(empresa.id)).rejects.toSatisfy(
        (e: ServiceError) => e instanceof ServiceError && e.code === 'INVALID_STATE',
      );
    });
  });
});
