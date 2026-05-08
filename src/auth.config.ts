import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

// Edge-safe config — no Node.js-only imports (no Credentials, no argon2).
// Used by middleware.ts directly. src/auth.ts extends this with providers.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isAuthenticated = !!auth?.user;

      if (pathname.startsWith('/login')) {
        if (isAuthenticated) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return true;
      }

      // /api/auth/* is NextAuth's own routes — never require auth
      if (pathname.startsWith('/api/auth')) {
        return true;
      }

      if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
        return isAuthenticated;
      }

      return true;
    },
  },
};
