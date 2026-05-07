import { Prisma, type Usuario } from '@prisma/client';
import { hash, verify } from '@node-rs/argon2';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/lib/errors/service-error';
import { CrearUsuarioSchema, type CrearUsuarioInput } from '@/lib/validations/usuario';

export type { CrearUsuarioInput };

// argon2id params: OWASP minimum for interactive login (m=19456 KiB, t=2, p=1)
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function crearUsuario(input: CrearUsuarioInput): Promise<Omit<Usuario, 'password'>> {
  const data = CrearUsuarioSchema.parse(input);
  const passwordHash = await hash(data.password, ARGON2_OPTIONS);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        email: data.email.toLowerCase(),
        nombre: data.nombre,
        apellidos: data.apellidos,
        password: passwordHash,
        rol: data.rol,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...sinPassword } = usuario;
    return sinPassword;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ServiceError('DUPLICATE', 'Ya existe un usuario con ese email.', { email: data.email });
    }
    throw err;
  }
}

export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  return prisma.usuario.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function verificarContrasena(hash: string, password: string): Promise<boolean> {
  return verify(hash, password);
}
