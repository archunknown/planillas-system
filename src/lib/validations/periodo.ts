import { z } from 'zod';

const EstadoPeriodoEnum = z.enum(['ABIERTO', 'CALCULADO', 'CERRADO']);

export const AbrirPeriodoSchema = z.object({
  empresaId: z.string().cuid(),
  anio: z.number().int().min(2020).max(2100),
  mes: z.number().int().min(1).max(12),
});

export const ActualizarInputsDetalleSchema = z.object({
  diasTrabajados: z.number().int().min(0).max(31).optional(),
  diasNoTrabajados: z.number().int().min(0).max(31).optional(),
  horasExtras25: z.number().min(0).max(200).optional(),
  horasExtras35: z.number().min(0).max(200).optional(),
  horasExtras100: z.number().min(0).max(200).optional(),
  minutosAtraso: z.number().int().min(0).max(2000).optional(),
  faltas: z.number().int().min(0).max(31).optional(),
  feriados: z.number().int().min(0).max(31).optional(),
});

export const ListarPeriodosSchema = z.object({
  empresaId: z.string().cuid(),
  anio: z.number().int().min(2020).max(2100).optional(),
  estado: EstadoPeriodoEnum.optional(),
  pagina: z.number().int().min(1).default(1),
  porPagina: z.number().int().min(1).max(100).default(12),
});

export type AbrirPeriodoInput = z.infer<typeof AbrirPeriodoSchema>;
export type ActualizarInputsDetalleInput = z.infer<typeof ActualizarInputsDetalleSchema>;
export type ListarPeriodosInput = z.input<typeof ListarPeriodosSchema>;
