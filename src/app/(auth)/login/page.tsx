import { signIn } from '@/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    'use server';
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>Iniciar sesión</h1>
      {error === 'CredentialsSignin' && (
        <p role="alert" style={{ color: 'red' }}>
          Email o contraseña incorrectos.
        </p>
      )}
      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <button type="submit">Ingresar</button>
      </form>
    </main>
  );
}
