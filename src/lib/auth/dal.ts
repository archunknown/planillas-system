import 'server-only';
import { cache } from 'react';
import { auth } from '@/auth';

export const getSession = cache(async () => {
  return auth();
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});
