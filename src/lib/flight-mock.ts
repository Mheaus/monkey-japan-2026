import type { FlightLeg } from '~/data/trip';
import type { FlightStatus } from '~/routes/api.flight';
import { type Phase, buildStaticStatus } from '~/lib/flight';

const MIN = 60 * 1000;

function isoFromNow(now: number, deltaMs: number) {
  return new Date(now + deltaMs).toISOString();
}

function isLongHaul(leg: FlightLeg) {
  return leg.to.code === 'HND';
}

type MockOpts = { delayMin: number; cancelled: boolean };

function applyDelay(status: FlightStatus, delayMin: number): FlightStatus {
  if (delayMin === 0) return status;
  const ms = delayMin * MIN;
  const shift = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + ms).toISOString() : null);
  return {
    ...status,
    estimatedOut: shift(status.estimatedOut ?? status.scheduledOut),
    estimatedOn: shift(status.estimatedOn ?? status.scheduledOn),
    estimatedIn: shift(status.estimatedIn ?? status.scheduledIn),
    departureDelay: delayMin * 60,
    arrivalDelay: delayMin * 60,
  };
}

function applyCancelled(status: FlightStatus): FlightStatus {
  return { ...status, status: 'Cancelled', cancelled: true, progressPercent: 0, lastPosition: null };
}

export function buildMockFlight(leg: FlightLeg, phase: Phase, opts: MockOpts): FlightStatus {
  const base = buildStaticStatus(leg);

  // `pre` keeps the static schedule but applies delay/cancellation modifiers
  if (phase === 'pre') {
    if (opts.cancelled) return applyCancelled(base);
    return applyDelay(base, opts.delayMin);
  }

  const now = Date.now();
  const longHaul = isLongHaul(leg);

  // helper to apply mock timing centered on `now`
  function withTiming(durationMin: number, progressPct: number): FlightStatus {
    const halfDuration = durationMin * MIN * (progressPct / 100);
    const dep = isoFromNow(now, -halfDuration);
    const arr = isoFromNow(now, durationMin * MIN - halfDuration);
    return {
      ...base,
      status: 'En Route',
      scheduledOut: dep,
      estimatedOut: dep,
      actualOut: dep,
      scheduledOff: dep,
      actualOff: dep,
      scheduledOn: arr,
      estimatedOn: arr,
      scheduledIn: arr,
      estimatedIn: arr,
      progressPercent: progressPct,
      lastPosition: {
        latitude: longHaul ? 60.1 : 48.5,
        longitude: longHaul ? 50.4 : 4.2,
        altitude: longHaul ? 380 : 350,
        groundspeed: longHaul ? 510 : 480,
        heading: longHaul ? 75 : 60,
        timestamp: new Date(now).toISOString(),
      },
    };
  }

  function landed(hoursAgo: number): FlightStatus {
    const arr = isoFromNow(now, -hoursAgo * 60 * MIN);
    const durationMin = longHaul ? 12 * 60 : 105;
    const dep = isoFromNow(now, -hoursAgo * 60 * MIN - durationMin * MIN);
    return {
      ...base,
      status: 'Arrived',
      scheduledOut: dep,
      estimatedOut: dep,
      actualOut: dep,
      scheduledOff: dep,
      actualOff: dep,
      scheduledOn: arr,
      estimatedOn: arr,
      actualOn: arr,
      scheduledIn: arr,
      estimatedIn: arr,
      actualIn: arr,
      progressPercent: 100,
    };
  }

  function scheduledFuture(minutesFromNow: number): FlightStatus {
    const dep = isoFromNow(now, minutesFromNow * MIN);
    const arr = isoFromNow(now, minutesFromNow * MIN + (longHaul ? 12 * 60 : 105) * MIN);
    return {
      ...base,
      status: 'Scheduled',
      scheduledOut: dep,
      estimatedOut: dep,
      scheduledOff: dep,
      scheduledOn: arr,
      estimatedOn: arr,
      scheduledIn: arr,
      estimatedIn: arr,
    };
  }

  let status: FlightStatus;

  if (phase === 'lh1071') {
    status = longHaul ? scheduledFuture(180) : withTiming(105, 28);
  } else if (phase === 'layover') {
    status = longHaul ? scheduledFuture(90) : landed(0.5);
  } else if (phase === 'lh716') {
    status = longHaul ? withTiming(12 * 60, 25) : landed(3);
  } else {
    status = landed(longHaul ? 0.2 : 12);
  }

  if (opts.cancelled) return applyCancelled(status);
  return applyDelay(status, opts.delayMin);
}
