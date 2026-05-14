import * as React from 'react';

export function PwaRegister() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        if (cancelled) return;
        registerSW({ immediate: true });
      } catch {
        // virtual:pwa-register only exists in prod build — silently ignore in dev
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
