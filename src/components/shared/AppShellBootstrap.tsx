import { type ReactElement, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppShellStore } from '@/stores/app-shell-store';

export function AppShellBootstrap(): ReactElement | null {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const bootstrapAppShell = useAppShellStore((state) => state.bootstrapAppShell);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      if (!token || !userId) {
        return;
      }

      try {
        await bootstrapAppShell({ token, userId });
        if (cancelled) {
          return;
        }
      } catch {
        // App shell bootstrap should not block route rendering.
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapAppShell, token, userId]);

  return null;
}
