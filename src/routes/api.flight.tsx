import type { Route } from './+types/api.flight';
import { FLIGHTS_BY_IDENT } from '~/data/trip';
import { buildStaticStatus } from '~/lib/flight';

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi';

const TRIP_WINDOW_START = new Date('2026-05-18T22:00:00Z').getTime();
const TRIP_WINDOW_END = new Date('2026-05-21T00:00:00Z').getTime();
const TARGET_DEPARTURE = new Date('2026-05-19T08:30:00Z').getTime();

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedResponse = { body: Record<string, unknown>; expiresAt: number };
const responseCache = new Map<string, CachedResponse>();

function readCache(key: string): CachedResponse | null {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return hit;
}

function writeCache(key: string, body: Record<string, unknown>) {
  responseCache.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cachedJson(body: Record<string, unknown>, ageSeconds: number) {
  const maxAge = Math.max(0, Math.ceil(CACHE_TTL_MS / 1000 - ageSeconds));
  return Response.json(body, {
    headers: {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'X-Cache': ageSeconds > 0 ? `HIT; age=${Math.round(ageSeconds)}` : 'MISS',
    },
  });
}

export type FlightStatus = {
  ident: string;
  status: string;
  cancelled: boolean;
  diverted: boolean;
  progressPercent: number;
  origin: { codeIata: string | null; name: string | null };
  destination: { codeIata: string | null; name: string | null };
  scheduledOut: string | null;
  estimatedOut: string | null;
  actualOut: string | null;
  scheduledOff: string | null;
  actualOff: string | null;
  scheduledOn: string | null;
  estimatedOn: string | null;
  actualOn: string | null;
  scheduledIn: string | null;
  estimatedIn: string | null;
  actualIn: string | null;
  departureDelay: number;
  arrivalDelay: number;
  gateOrigin: string | null;
  gateDestination: string | null;
  terminalOrigin: string | null;
  terminalDestination: string | null;
  lastPosition: {
    latitude: number;
    longitude: number;
    altitude: number;
    groundspeed: number;
    heading: number;
    timestamp: string;
  } | null;
};

type AeroFlight = {
  ident: string;
  ident_iata?: string | null;
  status?: string;
  cancelled?: boolean;
  diverted?: boolean;
  progress_percent?: number;
  origin?: { code_iata?: string | null; name?: string | null };
  destination?: { code_iata?: string | null; name?: string | null };
  scheduled_out?: string | null;
  estimated_out?: string | null;
  actual_out?: string | null;
  scheduled_off?: string | null;
  actual_off?: string | null;
  scheduled_on?: string | null;
  estimated_on?: string | null;
  actual_on?: string | null;
  scheduled_in?: string | null;
  estimated_in?: string | null;
  actual_in?: string | null;
  departure_delay?: number;
  arrival_delay?: number;
  gate_origin?: string | null;
  gate_destination?: string | null;
  terminal_origin?: string | null;
  terminal_destination?: string | null;
  last_position?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    groundspeed?: number;
    heading?: number;
    timestamp?: string;
  } | null;
};

function normalize(f: AeroFlight): FlightStatus {
  const pos = f.last_position;
  return {
    ident: f.ident_iata ?? f.ident,
    status: f.status ?? 'Unknown',
    cancelled: f.cancelled ?? false,
    diverted: f.diverted ?? false,
    progressPercent: f.progress_percent ?? 0,
    origin: { codeIata: f.origin?.code_iata ?? null, name: f.origin?.name ?? null },
    destination: { codeIata: f.destination?.code_iata ?? null, name: f.destination?.name ?? null },
    scheduledOut: f.scheduled_out ?? null,
    estimatedOut: f.estimated_out ?? null,
    actualOut: f.actual_out ?? null,
    scheduledOff: f.scheduled_off ?? null,
    actualOff: f.actual_off ?? null,
    scheduledOn: f.scheduled_on ?? null,
    estimatedOn: f.estimated_on ?? null,
    actualOn: f.actual_on ?? null,
    scheduledIn: f.scheduled_in ?? null,
    estimatedIn: f.estimated_in ?? null,
    actualIn: f.actual_in ?? null,
    departureDelay: f.departure_delay ?? 0,
    arrivalDelay: f.arrival_delay ?? 0,
    gateOrigin: f.gate_origin ?? null,
    gateDestination: f.gate_destination ?? null,
    terminalOrigin: f.terminal_origin ?? null,
    terminalDestination: f.terminal_destination ?? null,
    lastPosition:
      pos && pos.latitude != null && pos.longitude != null
        ? {
            latitude: pos.latitude,
            longitude: pos.longitude,
            altitude: pos.altitude ?? 0,
            groundspeed: pos.groundspeed ?? 0,
            heading: pos.heading ?? 0,
            timestamp: pos.timestamp ?? '',
          }
        : null,
  };
}

export async function loader({ params }: Route.LoaderArgs) {
  const ident = (params.ident ?? '').toUpperCase();
  const staticLeg = FLIGHTS_BY_IDENT[ident];
  if (!staticLeg) {
    return Response.json({ error: 'Unknown flight', flight: null }, { status: 404 });
  }

  const apiKey = process.env.AEROAPI_KEY;
  if (!apiKey) {
    return Response.json(
      { flight: buildStaticStatus(staticLeg), count: 0, source: 'static', reason: 'missing-key' },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    );
  }

  const cacheKey = ident;

  const hit = readCache(cacheKey);
  if (hit) {
    const ageSeconds = (Date.now() - (hit.expiresAt - CACHE_TTL_MS)) / 1000;
    return cachedJson(hit.body, ageSeconds);
  }

  const now = Date.now();
  const maxFuture = now + 2 * DAY_MS;
  const minPast = now - 10 * DAY_MS;

  if (TRIP_WINDOW_START > maxFuture) {
    const body = {
      flight: staticLeg ? buildStaticStatus(staticLeg) : null,
      count: 0,
      source: 'static' as const,
      reason: 'trip-too-far',
    };
    writeCache(cacheKey, body);
    return cachedJson(body, 0);
  }

  const startMs = Math.max(TRIP_WINDOW_START, minPast);
  const endMs = Math.min(TRIP_WINDOW_END, maxFuture);
  const start = new Date(startMs).toISOString();
  const end = new Date(endMs).toISOString();

  const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(cacheKey)}?start=${start}&end=${end}`;

  try {
    const res = await fetch(url, {
      headers: { 'x-apikey': apiKey, Accept: 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return Response.json(
        { error: `AeroAPI ${res.status}`, detail: text.slice(0, 200), flight: null },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const data = (await res.json()) as { flights?: AeroFlight[] };
    const flights = data.flights ?? [];

    let best: AeroFlight | null = null;
    let bestDelta = Infinity;
    for (const f of flights) {
      const ref = f.scheduled_out ?? f.scheduled_off;
      if (!ref) continue;
      const delta = Math.abs(new Date(ref).getTime() - TARGET_DEPARTURE);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = f;
      }
    }

    let resolved: FlightStatus | null;
    let source: 'aeroapi' | 'static';
    if (best) {
      resolved = normalize(best);
      source = 'aeroapi';
    } else if (staticLeg) {
      resolved = buildStaticStatus(staticLeg);
      source = 'static';
    } else {
      resolved = null;
      source = 'static';
    }
    const body = { flight: resolved, count: flights.length, source };
    writeCache(cacheKey, body);
    return cachedJson(body, 0);
  } catch (err) {
    return Response.json(
      { error: 'Network error', detail: (err as Error).message, flight: null },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
