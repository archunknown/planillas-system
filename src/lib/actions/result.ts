import { ServiceError } from '@/lib/errors/service-error';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    if (err instanceof ServiceError) {
      return fail(err.message, err.code);
    }
    // unauthorized() / forbidden() throw Next.js navigation interrupts — re-throw
    throw err;
  }
}
