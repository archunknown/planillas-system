// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button (shadcn/ui) — smoke test setup jsdom', () => {
  it('UI1 renderiza el label del botón', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDefined();
  });

  it('UI2 aplica variant destructive', () => {
    render(<Button variant="destructive">Eliminar</Button>);
    const btn = screen.getByRole('button', { name: 'Eliminar' });
    expect(btn.className).toMatch(/destructive/);
  });

  it('UI3 botón disabled no es clickeable', () => {
    render(<Button disabled>Enviar</Button>);
    const btn = screen.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
