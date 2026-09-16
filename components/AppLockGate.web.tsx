import type { ReactNode } from 'react';

/** En web no hay bloqueo por huella/Face ID: se salta directamente. */
export function AppLockGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
