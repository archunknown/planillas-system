import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/client';

const RegimenLaboralEnum = z.enum([
  'GENERAL',
  'MYPE_MICRO',
  'MYPE_PEQUENA',
  'CONSTRUCCION_CIVIL',
  'AGRARIO',
]);

const TipoContratoEnum = z.enum([
  'INDEFINIDO',
  'PLAZO_FIJO',
  'TIEMPO_PARCIAL',
  'INICIO_ACTIVIDAD',
  'NECESIDAD_MERCADO',
  'OBRA_DETERMINADA',
]);

const FrecuenciaPagoEnum = z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL']);

const SistemaPensionarioEnum = z.enum([
  'ONP',
  'AFP_HABITAT',
  'AFP_INTEGRA',
  'AFP_PRIMA',
  'AFP_PROFUTURO',
  'SIN_REGIMEN',
]);

const CategoriaCCEnum = z.enum(['OPERARIO', 'OFICIAL', 'PEON', 'NINGUNA']);

const unAnioAntes = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};
const unAnioAdelante = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

export const CrearContratoSchema = z
  .object({
    trabajadorId: z.string().min(1),
    empresaId: z.string().min(1),
    regimenLaboral: RegimenLaboralEnum,
    tipoContrato: TipoContratoEnum,
    fechaInicio: z
      .coerce.date()
      .refine((d) => d >= unAnioAntes(), { message: 'fechaInicio no puede ser más de 1 año en el pasado' })
      .refine((d) => d <= unAnioAdelante(), { message: 'fechaInicio no puede ser más de 1 año en el futuro' }),
    fechaFin: z.coerce.date().optional(),
    cargo: z.string().min(1).max(200),
    remuneracionBase: z
      .number()
      .positive({ message: 'remuneracionBase debe ser mayor a 0' }),
    frecuenciaPago: FrecuenciaPagoEnum,
    sistemaPensionario: SistemaPensionarioEnum,
    tieneAsignacionFamiliar: z.boolean().default(false),
    jornadaSemanal: z
      .number()
      .int()
      .min(1)
      .max(48, { message: 'jornadaSemanal no puede superar 48 horas (tope legal D.Leg 854)' })
      .default(48),
    categoriaCC: CategoriaCCEnum.default('NINGUNA'),
    zonaBonificacion: z.string().max(100).optional(),
    recibeBETA: z.boolean().default(false),
    esTiempoParcial: z.boolean().default(false),
  })
  .refine(
    (d) => !d.fechaFin || d.fechaFin > d.fechaInicio,
    { message: 'fechaFin debe ser posterior a fechaInicio', path: ['fechaFin'] },
  )
  .refine(
    // recibeBETA solo aplica al régimen agrario
    (d) => !d.recibeBETA || d.regimenLaboral === 'AGRARIO',
    { message: 'recibeBETA solo puede ser true en régimen AGRARIO', path: ['recibeBETA'] },
  );

// Campos inmutables en actualizar: trabajadorId, empresaId, regimenLaboral, fechaInicio.
// .strict() provoca ZodError si el caller envía alguno de esos campos.
// El servicio captura el ZodError y lo convierte en ServiceError INVALID_STATE.
export const ActualizarContratoSchema = z
  .object({
    tipoContrato: TipoContratoEnum.optional(),
    fechaFin: z.coerce.date().optional(),
    cargo: z.string().min(1).max(200).optional(),
    remuneracionBase: z.number().positive().optional(),
    frecuenciaPago: FrecuenciaPagoEnum.optional(),
    sistemaPensionario: SistemaPensionarioEnum.optional(),
    tieneAsignacionFamiliar: z.boolean().optional(),
    jornadaSemanal: z.number().int().min(1).max(48).optional(),
    categoriaCC: CategoriaCCEnum.optional(),
    zonaBonificacion: z.string().max(100).optional(),
    recibeBETA: z.boolean().optional(),
    esTiempoParcial: z.boolean().optional(),
    motivoCese: z.string().max(300).optional(),
  })
  .strict();

export const ListarContratosSchema = z.object({
  incluirEliminados: z.boolean().default(false),
  soloActivos: z.boolean().optional(),
  pagina: z.number().int().min(1).default(1),
  porPagina: z.number().int().min(1).max(100).default(20),
});

export const CerrarContratoSchema = z.object({
  fechaFin: z.coerce.date(),
  motivoCese: z.string().min(1).max(300),
});

export type CrearContratoInput = z.infer<typeof CrearContratoSchema>;
export type ActualizarContratoInput = z.infer<typeof ActualizarContratoSchema>;
export type ListarContratosInput = z.infer<typeof ListarContratosSchema>;
export type CerrarContratoInput = z.infer<typeof CerrarContratoSchema>;

// Needed to convert remuneracionBase (number) to Decimal for Prisma
export function remuneracionToDecimal(v: number): Decimal {
  return new Decimal(v.toString());
}
