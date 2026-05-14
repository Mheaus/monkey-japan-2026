import { ARRIVAL_TIME, DEPARTURE_TIME, FLIGHTS, type FlightLeg } from '~/data/trip';
import type { FlightStatus } from '~/routes/api.flight';

export function buildStaticStatus(leg: FlightLeg): FlightStatus {
  return {
    ident: leg.ident,
    status: 'Scheduled',
    cancelled: false,
    diverted: false,
    progressPercent: 0,
    origin: { codeIata: leg.from.code, name: `${leg.from.city} Airport` },
    destination: { codeIata: leg.to.code, name: `${leg.to.city} Airport` },
    scheduledOut: leg.scheduledDeparture.toISOString(),
    estimatedOut: leg.scheduledDeparture.toISOString(),
    actualOut: null,
    scheduledOff: leg.scheduledDeparture.toISOString(),
    actualOff: null,
    scheduledOn: leg.scheduledArrival.toISOString(),
    estimatedOn: leg.scheduledArrival.toISOString(),
    actualOn: null,
    scheduledIn: leg.scheduledArrival.toISOString(),
    estimatedIn: leg.scheduledArrival.toISOString(),
    actualIn: null,
    departureDelay: 0,
    arrivalDelay: 0,
    gateOrigin: leg.gateOrigin ?? null,
    gateDestination: leg.gateDestination ?? null,
    terminalOrigin: leg.terminalOrigin ?? null,
    terminalDestination: leg.terminalDestination ?? null,
    lastPosition: null,
  };
}

export type Phase = 'pre' | 'lh1071' | 'layover' | 'lh716' | 'arrived';

export type FlightApiResponse = {
  flight: FlightStatus | null;
  error?: string;
  count?: number;
  reason?: string;
  source?: 'aeroapi' | 'static';
};

export async function fetchFlight(ident: string): Promise<FlightApiResponse> {
  const res = await fetch(`/api/flight/${ident}`);
  if (res.status >= 500) {
    const body = (await res.json().catch(() => ({}))) as FlightApiResponse;
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as FlightApiResponse;
}

export function derivePhase(s1: FlightStatus | null, s2: FlightStatus | null): Phase {
  if (s2?.actualOn) return 'arrived';
  if (s2?.actualOff) return 'lh716';
  if (s1?.actualOn) return 'layover';
  if (s1?.actualOff) return 'lh1071';
  return 'pre';
}

export function computeCountdownTarget(
  phase: Phase,
  s1: FlightStatus | null,
  s2: FlightStatus | null,
): { target: Date | null; label: string } {
  if (phase === 'arrived') return { target: null, label: '' };
  if (phase === 'lh716') {
    const t = s2?.estimatedOn ?? s2?.scheduledOn ?? null;
    return { target: t ? new Date(t) : ARRIVAL_TIME, label: 'Atterrissage Tokyo' };
  }
  if (phase === 'layover') {
    const t = s2?.estimatedOut ?? s2?.scheduledOut ?? null;
    return { target: t ? new Date(t) : FLIGHTS[1].scheduledDeparture, label: 'Décollage Francfort' };
  }
  if (phase === 'lh1071') {
    const t = s1?.estimatedOn ?? s1?.scheduledOn ?? null;
    return { target: t ? new Date(t) : FLIGHTS[0].scheduledArrival, label: 'Atterrissage Francfort' };
  }
  return { target: DEPARTURE_TIME, label: 'Décollage Bordeaux' };
}

export const PARIS_TIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
});

export const TOKYO_TIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
});

export function fmtTime(iso: string | null | undefined, tz: 'paris' | 'tokyo') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (tz === 'paris' ? PARIS_TIME_FMT : TOKYO_TIME_FMT).format(d);
}

export function fmtDelay(seconds: number) {
  if (!seconds) return null;
  const min = Math.round(seconds / 60);
  if (Math.abs(min) < 1) return null;
  return `${min > 0 ? '+' : ''}${min} min`;
}
