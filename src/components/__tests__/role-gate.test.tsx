// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGate } from '@/components/role-gate';

describe('RoleGate', () => {
  it('RG1 renderiza children cuando el rol coincide', () => {
    render(
      <RoleGate roles={['ADMIN']} userRol="ADMIN">
        <span>Acción admin</span>
      </RoleGate>
    );
    expect(screen.getByText('Acción admin')).toBeDefined();
  });

  it('RG2 no renderiza children cuando el rol no coincide', () => {
    render(
      <RoleGate roles={['ADMIN']} userRol="CLIENTE">
        <span>Acción admin</span>
      </RoleGate>
    );
    expect(screen.queryByText('Acción admin')).toBeNull();
  });

  it('RG3 renderiza fallback cuando el rol no coincide', () => {
    render(
      <RoleGate roles={['ADMIN']} userRol="CONTADOR" fallback={<span>Sin permisos</span>}>
        <span>Solo admin</span>
      </RoleGate>
    );
    expect(screen.queryByText('Solo admin')).toBeNull();
    expect(screen.getByText('Sin permisos')).toBeDefined();
  });

  it('RG4 acepta múltiples roles', () => {
    render(
      <RoleGate roles={['ADMIN', 'CONTADOR']} userRol="CONTADOR">
        <span>Admin o Contador</span>
      </RoleGate>
    );
    expect(screen.getByText('Admin o Contador')).toBeDefined();
  });
});
