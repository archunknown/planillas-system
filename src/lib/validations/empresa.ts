import { z } from 'zod';

const TipoEmpresaEnum = z.enum(['PERSONA_NATURAL', 'EIRL', 'SRL', 'SAC', 'SA', 'OTRO']);

const EmpresaBaseSchema = z.object({
  ruc: z.string().length(11).regex(/^\d{11}$/),
  razonSocial: z.string().min(1).max(200),
  nombreComercial: z.string().max(200).optional(),
  tipoEmpresa: TipoEmpresaEnum,
  direccion: z.string().min(1).max(300),
  distrito: z.string().min(1).max(100),
  provincia: z.string().min(1).max(100),
  departamento: z.string().min(1).max(100),
  telefono: z.string().max(20).optional(),
  email: z.string().email().max(200).optional(),
  activa: z.boolean(),
});

// Para crear: activa tiene default true
export const CrearEmpresaSchema = EmpresaBaseSchema.extend({
  activa: z.boolean().default(true),
});

// Para actualizar: todos opcionales, sin defaults (para no sobreescribir campos no enviados)
export const ActualizarEmpresaSchema = EmpresaBaseSchema
  .omit({ ruc: true })
  .partial();

export const ListarEmpresasSchema = z.object({
  incluirEliminados: z.boolean().default(false),
  soloActivas: z.boolean().optional(),
  pagina: z.number().int().min(1).default(1),
  porPagina: z.number().int().min(1).max(100).default(20),
});

export type CrearEmpresaInput = z.input<typeof CrearEmpresaSchema>;
export type ActualizarEmpresaInput = z.infer<typeof ActualizarEmpresaSchema>;
export type ListarEmpresasInput = z.input<typeof ListarEmpresasSchema>;
