import type { DefaultSession } from 'next-auth';

// Local union to avoid importing from @prisma/client in a .d.ts file
type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      rol: Rol;
      empresasIds: string[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol?: Rol;
    empresasIds?: string[];
  }
}
