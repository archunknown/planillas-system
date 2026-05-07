import { z } from 'zod';

export const CrearUsuarioSchema = z.object({
  email: z.string().email().max(254),
  nombre: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  password: z.string().min(8).max(72),
  rol: z.enum(['ADMIN', 'CONTADOR', 'CLIENTE']),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CrearUsuarioInput = z.infer<typeof CrearUsuarioSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
