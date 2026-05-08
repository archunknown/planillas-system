import { z } from 'zod';
import { CrearHijoSchema } from './hijo';

const ahora = () => new Date();
const hace120Anios = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d;
};

export const CrearTrabajadorSchema = z.object({
  empresaId: z.string().min(1),
  dni: z.string().length(8).regex(/^\d{8}$/),
  apellidoPaterno: z.string().min(1).max(100),
  apellidoMaterno: z.string().min(1).max(100),
  nombres: z.string().min(1).max(200),
  fechaNacimiento: z
    .coerce.date()
    .refine((d) => d <= ahora(), { message: 'fechaNacimiento no puede ser futura' })
    .refine((d) => d >= hace120Anios(), { message: 'fechaNacimiento supera los 120 años' }),
  sexo: z.enum(['M', 'F']),
  direccion: z.string().max(300).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email().max(200).optional(),
  estadoCivil: z.string().max(50).optional(),
});

export const ActualizarTrabajadorSchema = CrearTrabajadorSchema
  .omit({ empresaId: true })
  .partial();

export const ListarTrabajadoresSchema = z.object({
  incluirEliminados: z.boolean().default(false),
  pagina: z.number().int().min(1).default(1),
  porPagina: z.number().int().min(1).max(100).default(20),
});

export const CrearTrabajadorConHijosSchema = z.object({
  trabajador: CrearTrabajadorSchema,
  hijos: z.array(CrearHijoSchema).default([]),
});

export type CrearTrabajadorInput = z.infer<typeof CrearTrabajadorSchema>;
export type ActualizarTrabajadorInput = z.infer<typeof ActualizarTrabajadorSchema>;
export type ListarTrabajadoresInput = z.input<typeof ListarTrabajadoresSchema>;
export type CrearTrabajadorConHijosInput = z.input<typeof CrearTrabajadorConHijosSchema>;
