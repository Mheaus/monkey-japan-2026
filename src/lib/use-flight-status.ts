import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FlightLeg } from '~/data/trip';
import type { FlightStatus } from '~/routes/api.flight';
import { fetchFlight } from '~/lib/flight';
import { buildMockFlight } from '~/lib/flight-mock';
import { useDevPhase } from '~/lib/dev-phase';

function useTick(active: boolean, intervalMs: number) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}

export type FlightStatusResult = {
  data: FlightStatus | null;
  loaded: boolean;
  error: string | null;
  isMocked: boolean;
  isFetching: boolean;
  source: 'aeroapi' | 'static' | 'mock' | null;
};

export function useFlightStatus(leg: FlightLeg): FlightStatusResult {
  const { phase: mockPhase, delayMin, cancelled } = useDevPhase();
  const mockActive = mockPhase !== null || delayMin > 0 || cancelled;

  // Mock data uses Date.now() anchors; re-render every second so the UI ticks
  // exactly like the live one (progress bars, ETA, countdowns).
  useTick(mockActive, 1000);

  const query = useQuery({
    queryKey: ['flight', leg.ident],
    queryFn: () => fetchFlight(leg.ident),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    enabled: !mockActive,
  });

  if (mockActive) {
    return {
      data: buildMockFlight(leg, mockPhase ?? 'pre', { delayMin, cancelled }),
      loaded: true,
      error: null,
      isMocked: true,
      isFetching: false,
      source: 'mock',
    };
  }

  return {
    data: query.data?.flight ?? null,
    loaded: query.isFetched,
    error: query.data?.error ?? (query.error ? (query.error as Error).message : null),
    isMocked: false,
    isFetching: query.isFetching,
    source: query.data?.source ?? null,
  };
}
