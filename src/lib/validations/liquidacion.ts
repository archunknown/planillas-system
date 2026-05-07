import { z } from 'zod';

export const CalcularLiquidacionSchema = z.object({
  contratoId: z.string().min(1),
  fechaCese: z.coerce.date().refine(
    (d) => {
      const unAnioFuturo = new Date();
      unAnioFuturo.setFullYear(unAnioFuturo.getFullYear() + 1);
      return d <= unAnioFuturo;
    },
    { message: 'fechaCese no puede ser más de 1 año en el futuro' },
  ),
});

export const AnularLiquidacionSchema = z.object({
  motivoAnulacion: z.string().min(5).max(300),
});

export const ListarLiquidacionesSchema = z.object({
  incluirAnuladas: z.boolean().default(false),
  fechaCeseDesde: z.coerce.date().optional(),
  fechaCeseHasta: z.coerce.date().optional(),
  pagina: z.number().int().min(1).default(1),
  porPagina: z.number().int().min(1).max(100).default(20),
});

export type CalcularLiquidacionInput = z.infer<typeof CalcularLiquidacionSchema>;
export type AnularLiquidacionInput = z.infer<typeof AnularLiquidacionSchema>;
export type ListarLiquidacionesInput = z.infer<typeof ListarLiquidacionesSchema>;
