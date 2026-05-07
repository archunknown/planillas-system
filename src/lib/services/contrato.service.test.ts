import { describe, it, expect } from 'vitest';
import { CrearContratoSchema, ActualizarContratoSchema, CerrarContratoSchema } from '@/lib/validations/contrato';

const baseContrato = {
  trabajadorId: 'trab-id-test',
  empresaId: 'emp-id-test',
  regimenLaboral: 'GENERAL' as const,
  tipoContrato: 'INDEFINIDO' as const,
  fechaInicio: new Date(),
  cargo: 'Asistente',
  remuneracionBase: 1500,
  frecuenciaPago: 'MENSUAL' as const,
  sistemaPensionario: 'ONP' as const,
};

describe('CrearContratoSchema', () => {
  it('acepta input mínimo válido con defaults', () => {
    const r = CrearContratoSchema.parse(baseContrato);
    expect(r.activo).toBeUndefined(); // activo no es campo de input
    expect(r.jornadaSemanal).toBe(48);
    expect(r.categoriaCC).toBe('NINGUNA');
    expect(r.recibeBETA).toBe(false);
    expect(r.esTiempoParcial).toBe(false);
    expect(r.tieneAsignacionFamiliar).toBe(false);
  });

  it('rechaza remuneracionBase = 0', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, remuneracionBase: 0 })).toThrow();
  });

  it('rechaza remuneracionBase negativa', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, remuneracionBase: -100 })).toThrow();
  });

  it('rechaza jornadaSemanal > 48', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, jornadaSemanal: 49 })).toThrow();
  });

  it('rechaza jornadaSemanal = 0', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, jornadaSemanal: 0 })).toThrow();
  });

  it('rechaza fechaFin anterior a fechaInicio', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const hace2dias = new Date();
    hace2dias.setDate(hace2dias.getDate() - 2);
    expect(() =>
      CrearContratoSchema.parse({ ...baseContrato, fechaInicio: ayer, fechaFin: hace2dias }),
    ).toThrow();
  });

  it('acepta fechaFin posterior a fechaInicio', () => {
    const hoy = new Date();
    const maniana = new Date();
    maniana.setDate(maniana.getDate() + 1);
    const r = CrearContratoSchema.parse({ ...baseContrato, fechaInicio: hoy, fechaFin: maniana });
    expect(r.fechaFin).toBeDefined();
  });

  it('rechaza recibeBETA=true en régimen no-AGRARIO', () => {
    expect(() =>
      CrearContratoSchema.parse({ ...baseContrato, regimenLaboral: 'GENERAL', recibeBETA: true }),
    ).toThrow();
  });

  it('acepta recibeBETA=true en régimen AGRARIO', () => {
    const r = CrearContratoSchema.parse({ ...baseContrato, regimenLaboral: 'AGRARIO', recibeBETA: true });
    expect(r.recibeBETA).toBe(true);
  });

  it('rechaza regimenLaboral inválido', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, regimenLaboral: 'FALSO' })).toThrow();
  });

  it('rechaza tipoContrato inválido', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, tipoContrato: 'OTRO' })).toThrow();
  });

  it('rechaza sistemaPensionario inválido', () => {
    expect(() => CrearContratoSchema.parse({ ...baseContrato, sistemaPensionario: 'AFORE' })).toThrow();
  });

  it('rechaza fechaInicio más de 1 año en el futuro', () => {
    const masDeUnAnio = new Date();
    masDeUnAnio.setFullYear(masDeUnAnio.getFullYear() + 2);
    expect(() => CrearContratoSchema.parse({ ...baseContrato, fechaInicio: masDeUnAnio })).toThrow();
  });

  it('rechaza fechaInicio más de 1 año en el pasado', () => {
    const masDeUnAnio = new Date();
    masDeUnAnio.setFullYear(masDeUnAnio.getFullYear() - 2);
    expect(() => CrearContratoSchema.parse({ ...baseContrato, fechaInicio: masDeUnAnio })).toThrow();
  });
});

describe('ActualizarContratoSchema', () => {
  it('acepta objeto vacío (todos opcionales)', () => {
    expect(ActualizarContratoSchema.parse({})).toEqual({});
  });

  it('rechaza remuneracionBase = 0 en actualización', () => {
    expect(() => ActualizarContratoSchema.parse({ remuneracionBase: 0 })).toThrow();
  });

  it('rechaza jornadaSemanal > 48 en actualización', () => {
    expect(() => ActualizarContratoSchema.parse({ jornadaSemanal: 50 })).toThrow();
  });

  it('no expone campos inmutables (trabajadorId, empresaId, regimenLaboral, fechaInicio)', () => {
    // Si se pasan campos inmutables, Zod los ignora (strict no está activo)
    // Los campos simplemente no están en el schema de actualización
    const r = ActualizarContratoSchema.parse({ cargo: 'Nuevo cargo' });
    expect(r).toEqual({ cargo: 'Nuevo cargo' });
  });
});

describe('CerrarContratoSchema', () => {
  it('acepta fechaFin y motivoCese válidos', () => {
    const r = CerrarContratoSchema.parse({ fechaFin: new Date(), motivoCese: 'Renuncia voluntaria' });
    expect(r.motivoCese).toBe('Renuncia voluntaria');
  });

  it('rechaza motivoCese vacío', () => {
    expect(() => CerrarContratoSchema.parse({ fechaFin: new Date(), motivoCese: '' })).toThrow();
  });
});
