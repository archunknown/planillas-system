import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { authConfig } from './auth.config';
import { LoginSchema } from '@/lib/validations/usuario';
import {
  obtenerCredencialPorEmail,
  verificarContrasena,
} from '@/lib/services/usuario.service';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

export type AuthPayload = {
  id: string;
  email: string;
  name: string;
  rol: Rol;
  empresasIds: string[];
};

export async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>
): Promise<AuthPayload | null> {
  const parsed = LoginSchema.safeParse({
    email: credentials.email,
    password: credentials.password,
  });
  if (!parsed.success) return null;

  const email = parsed.data.email.toLowerCase();
  const cred = await obtenerCredencialPorEmail(email);
  if (!cred || !cred.activo) return null;

  const ok = await verificarContrasena(cred.password, parsed.data.password);
  if (!ok) return null;

  return {
    id: cred.id,
    email: cred.email,
    name: `${cred.nombre} ${cred.apellidos}`,
    rol: cred.rol as Rol,
    empresasIds: cred.empresasIds,
  };
}

export function embedUserInToken(token: JWT, user: AuthPayload): JWT {
  return { ...token, rol: user.rol, empresasIds: user.empresasIds };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: authorizeCredentials as (
        credentials: Partial<Record<string, unknown>>,
        request: Request
      ) => Promise<AuthPayload | null>,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user, trigger }) {
      if (trigger === 'signIn' && user) {
        return embedUserInToken(token, user as unknown as AuthPayload);
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      return {
        ...session,
        user: {
          ...session.user,
          rol: token.rol,
          empresasIds: token.empresasIds ?? [],
        },
      };
    },
  },
});
