import * as React from 'react';

function isModuleNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Failed to (fetch|load) dynamically imported module|Cannot find module/i.test(msg);
}

export function PwaRegister() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        if (cancelled) return;
        registerSW({
          immediate: true,
          onRegisterError(err) {
            console.warn('[pwa] SW registration failed:', err);
          },
        });
      } catch (err) {
        // virtual:pwa-register only exists in prod build; silently ignore in dev.
        // Anything else is a genuine registration failure we want to surface.
        if (!isModuleNotFound(err) && import.meta.env.PROD) {
          console.warn('[pwa] failed to load virtual:pwa-register:', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
