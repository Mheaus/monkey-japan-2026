import * as React from 'react';
import type { Phase } from '~/lib/flight';

type DevPhaseValue = {
  phase: Phase | null;
  setPhase: (p: Phase | null) => void;
  delayMin: number;
  setDelayMin: (m: number) => void;
  cancelled: boolean;
  setCancelled: (b: boolean) => void;
  reset: () => void;
};

const DevPhaseContext = React.createContext<DevPhaseValue>({
  phase: null,
  setPhase: () => {},
  delayMin: 0,
  setDelayMin: () => {},
  cancelled: false,
  setCancelled: () => {},
  reset: () => {},
});

export function DevPhaseProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = React.useState<Phase | null>(null);
  const [delayMin, setDelayMin] = React.useState(0);
  const [cancelled, setCancelled] = React.useState(false);

  const reset = React.useCallback(() => {
    setPhase(null);
    setDelayMin(0);
    setCancelled(false);
  }, []);

  const value = React.useMemo(
    () => ({ phase, setPhase, delayMin, setDelayMin, cancelled, setCancelled, reset }),
    [phase, delayMin, cancelled, reset],
  );

  return <DevPhaseContext.Provider value={value}>{children}</DevPhaseContext.Provider>;
}

export function useDevPhase() {
  return React.useContext(DevPhaseContext);
}
