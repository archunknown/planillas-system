import { z } from 'zod';

const ahora = () => new Date();
const hace100Anios = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d;
};

export const CrearHijoSchema = z.object({
  nombres: z.string().min(1).max(200),
  fechaNacimiento: z
    .coerce.date()
    .refine((d) => d <= ahora(), { message: 'fechaNacimiento no puede ser futura' })
    .refine((d) => d >= hace100Anios(), { message: 'fechaNacimiento supera los 100 años' }),
  dni: z.string().length(8).regex(/^\d{8}$/).optional(),
});

export const ActualizarHijoSchema = CrearHijoSchema.partial();

export type CrearHijoInput = z.infer<typeof CrearHijoSchema>;
export type ActualizarHijoInput = z.infer<typeof ActualizarHijoSchema>;
