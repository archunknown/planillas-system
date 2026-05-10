import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceError } from '@/lib/errors/service-error';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireRole: vi.fn(),
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/services/trabajador.service', () => ({
  crear: vi.fn(),
  crearConHijos: vi.fn(),
  obtenerPorId: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  restaurar: vi.fn(),
  agregarHijo: vi.fn(),
  actualizarHijo: vi.fn(),
  eliminarHijo: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    trabajador: { findUnique: vi.fn() },
    hijo: { findUnique: vi.fn() },
  },
}));

import { requireRole, requireOwnership } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { prisma } from '@/lib/prisma';
import {
  crearTrabajadorAction,
  crearTrabajadorConHijosAction,
  actualizarTrabajadorAction,
  eliminarTrabajadorAction,
  restaurarTrabajadorAction,
  agregarHijoAction,
  actualizarHijoAction,
  eliminarHijoAction,
} from './trabajador.actions';

const mockRequireRole = vi.mocked(requireRole);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockObtenerPorId = vi.mocked(trabajadorService.obtenerPorId);
const mockCrear = vi.mocked(trabajadorService.crear);
const mockCrearConHijos = vi.mocked(trabajadorService.crearConHijos);
const mockActualizar = vi.mocked(trabajadorService.actualizar);
const mockEliminar = vi.mocked(trabajadorService.eliminar);
const mockRestaurar = vi.mocked(trabajadorService.restaurar);
const mockAgregarHijo = vi.mocked(trabajadorService.agregarHijo);
const mockActualizarHijo = vi.mocked(trabajadorService.actualizarHijo);
const mockEliminarHijo = vi.mocked(trabajadorService.eliminarHijo);
const mockTrabajadorFindUnique = vi.mocked(prisma.trabajador.findUnique);
const mockHijoFindUnique = vi.mocked(prisma.hijo.findUnique);

const TRABAJADOR = { id: 't1', empresaId: 'e1', dni: '12345678' };
const HIJO = { id: 'h1', trabajadorId: 't1' };

beforeEach(() => vi.clearAllMocks());

describe('crearTrabajadorAction', () => {
  it('TA1 happy path con ADMIN — llama service y verifica ownership', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCrear.mockResolvedValue(TRABAJADOR as never);
    await crearTrabajadorAction({ empresaId: 'e1' } as never);
    expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN', 'CONTADOR']);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockCrear).toHaveBeenCalled();
  });

  it('TA2 sin sesión → unauthorized', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    await expect(crearTrabajadorAction({ empresaId: 'e1' } as never)).rejects.toThrow('UNAUTHORIZED');
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('TA3 rol no permitido → forbidden', async () => {
    mockRequireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearTrabajadorAction({ empresaId: 'e1' } as never)).rejects.toThrow('FORBIDDEN');
  });

  it('TA4 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(crearTrabajadorAction({ empresaId: 'e99' } as never)).rejects.toThrow('FORBIDDEN');
    expect(mockCrear).not.toHaveBeenCalled();
  });
});

describe('crearTrabajadorConHijosAction', () => {
  it('TA5 happy path — usa empresaId del trabajador anidado', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCrearConHijos.mockResolvedValue({ ...TRABAJADOR, hijos: [] } as never);
    await crearTrabajadorConHijosAction({ trabajador: { empresaId: 'e1' }, hijos: [] } as never);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
  });
});

describe('actualizarTrabajadorAction', () => {
  it('TA6 happy path — resuelve empresaId desde DB', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockResolvedValue(TRABAJADOR as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(TRABAJADOR as never);
    await actualizarTrabajadorAction('t1', {} as never);
    expect(mockObtenerPorId).toHaveBeenCalledWith('t1');
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
  });

  it('TA7 ADMIN bypass ownership — requireOwnership resuelve sin forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockResolvedValue(TRABAJADOR as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizar.mockResolvedValue(TRABAJADOR as never);
    await actualizarTrabajadorAction('t1', {} as never);
    expect(mockActualizar).toHaveBeenCalled();
  });

  it('TA8 CONTADOR sin ownership → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockResolvedValue(TRABAJADOR as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(actualizarTrabajadorAction('t1', {} as never)).rejects.toThrow('FORBIDDEN');
    expect(mockActualizar).not.toHaveBeenCalled();
  });
});

describe('eliminarTrabajadorAction', () => {
  it('TA9 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockResolvedValue(TRABAJADOR as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockEliminar.mockResolvedValue(TRABAJADOR as never);
    await eliminarTrabajadorAction('t1');
    expect(mockEliminar).toHaveBeenCalledWith('t1');
  });
});

describe('restaurarTrabajadorAction', () => {
  it('TA10 happy path — usa prisma directamente para resolver empresaId del eliminado', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockTrabajadorFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRestaurar.mockResolvedValue(TRABAJADOR as never);
    await restaurarTrabajadorAction('t1');
    expect(mockTrabajadorFindUnique).toHaveBeenCalledWith({ where: { id: 't1' }, select: { empresaId: true } });
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
  });

  it('TA11 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockTrabajadorFindUnique.mockResolvedValue({ empresaId: 'e1' } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(restaurarTrabajadorAction('t1')).rejects.toThrow('FORBIDDEN');
    expect(mockRestaurar).not.toHaveBeenCalled();
  });
});

describe('agregarHijoAction', () => {
  it('TA12 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockResolvedValue(TRABAJADOR as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockAgregarHijo.mockResolvedValue(HIJO as never);
    await agregarHijoAction('t1', {} as never);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockAgregarHijo).toHaveBeenCalledWith('t1', {});
  });
});

describe('actualizarHijoAction', () => {
  it('TA13 happy path — resuelve empresa vía hijo→trabajador', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockHijoFindUnique.mockResolvedValue({ trabajadorId: 't1', trabajador: { empresaId: 'e1' } } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockActualizarHijo.mockResolvedValue(HIJO as never);
    await actualizarHijoAction('h1', {} as never);
    expect(mockRequireOwnership).toHaveBeenCalledWith('e1');
    expect(mockActualizarHijo).toHaveBeenCalledWith('h1', {});
  });

  it('TA14 ownership violado → forbidden', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockHijoFindUnique.mockResolvedValue({ trabajadorId: 't1', trabajador: { empresaId: 'e99' } } as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(actualizarHijoAction('h1', {} as never)).rejects.toThrow('FORBIDDEN');
  });
});

describe('eliminarHijoAction', () => {
  it('TA15 happy path', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockHijoFindUnique.mockResolvedValue({ trabajadorId: 't1', trabajador: { empresaId: 'e1' } } as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockEliminarHijo.mockResolvedValue(HIJO as never);
    await eliminarHijoAction('h1');
    expect(mockEliminarHijo).toHaveBeenCalledWith('h1');
  });
});

describe('safeAction wrapping — ServiceError → ActionResult', () => {
  it('TA-NEW1 crearTrabajadorAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockCrear.mockRejectedValue(new ServiceError('DUPLICATE', 'DNI duplicado'));
    const result = await crearTrabajadorAction({ empresaId: 'e1' } as never);
    expect(result).toEqual({ ok: false, error: 'DNI duplicado', code: 'DUPLICATE' });
  });

  it('TA-NEW2 actualizarTrabajadorAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockRejectedValue(new ServiceError('NOT_FOUND', 'Trabajador no encontrado'));
    const result = await actualizarTrabajadorAction('t99', {} as never);
    expect(result).toEqual({ ok: false, error: 'Trabajador no encontrado', code: 'NOT_FOUND' });
  });

  it('TA-NEW3 agregarHijoAction ServiceError → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockObtenerPorId.mockRejectedValue(new ServiceError('INVALID_STATE', 'Trabajador eliminado'));
    const result = await agregarHijoAction('t1', {} as never);
    expect(result).toEqual({ ok: false, error: 'Trabajador eliminado', code: 'INVALID_STATE' });
  });

  it('TA-NEW4 eliminarHijoAction ServiceError hijo no encontrado → { ok: false, error, code }', async () => {
    mockRequireRole.mockResolvedValue(undefined as never);
    mockHijoFindUnique.mockResolvedValue(null as never);
    const result = await eliminarHijoAction('h99');
    expect(result).toEqual({ ok: false, error: 'Hijo no encontrado: h99.', code: 'NOT_FOUND' });
  });
});
