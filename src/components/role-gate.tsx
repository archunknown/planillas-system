'use client';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

interface RoleGateProps {
  roles: Rol[];
  userRol: Rol;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, userRol, children, fallback = null }: RoleGateProps) {
  if (!roles.includes(userRol)) return <>{fallback}</>;
  return <>{children}</>;
}
