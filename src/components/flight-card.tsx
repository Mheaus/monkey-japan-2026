import * as React from 'react';
import { Icon } from '@iconify/react';

import type { FlightLeg } from '~/data/trip';
import type { FlightStatus } from '~/routes/api.flight';
import { fmtDelay, fmtTime } from '~/lib/flight';

function statusBadge(s: FlightStatus | null, loaded: boolean) {
  if (!s) return { label: loaded ? 'Programmé' : 'Chargement…', color: 'bg-ink/10 text-ink/60' };
  if (s.cancelled) return { label: 'Annulé', color: 'bg-stamp-red/20 text-stamp-red' };
  if (s.diverted) return { label: 'Dérouté', color: 'bg-gold/30 text-ink' };
  if (s.actualOn) return { label: 'Atterri', color: 'bg-matcha/30 text-ink' };
  if (s.actualOff) return { label: 'En vol', color: 'bg-ocean/30 text-ocean' };
  if (s.actualOut) return { label: 'Roulage', color: 'bg-ocean/20 text-ink' };
  return { label: 'Programmé', color: 'bg-ink/10 text-ink/70' };
}

export function FlightCard({
  leg,
  status,
  loaded,
  arrivalTz,
  variant = 'compact',
}: {
  leg: FlightLeg;
  status: FlightStatus | null;
  loaded: boolean;
  arrivalTz: 'paris' | 'tokyo';
  variant?: 'compact' | 'detailed';
}) {
  const badge = statusBadge(status, loaded);
  const depDelay = status ? fmtDelay(status.departureDelay) : null;
  const arrDelay = status ? fmtDelay(status.arrivalDelay) : null;

  const schedOut = status?.scheduledOut ?? leg.scheduledDeparture.toISOString();
  const schedIn = status?.scheduledIn ?? leg.scheduledArrival.toISOString();
  const realOut = status?.actualOut ?? status?.estimatedOut ?? null;
  const realIn = status?.actualIn ?? status?.estimatedIn ?? null;
  const inFlight = !!status?.actualOff && !status?.actualOn;
  const arrived = !!status?.actualOn;

  return (
    <div className="paper-card rounded-xl p-4 sm:p-5 bg-paper relative overflow-hidden">
      {inFlight && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-ocean/40 via-ocean to-ocean/40 animate-pulse" />
      )}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:plane" className={`text-lg ${inFlight ? 'text-ocean' : 'text-ink/60'}`} />
          <span className="font-handwritten font-bold text-lg text-ink">{leg.ident}</span>
          <span className="text-ink/40 text-xs hidden sm:inline">{leg.airline}</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-3">
        <div className="text-left">
          <div className="font-handwritten font-bold text-3xl sm:text-4xl text-ink leading-none">{leg.from.code}</div>
          <div className="text-xs text-ink/50 mt-1">{leg.from.city}</div>
          <div className="mt-2 text-sm tabular-nums text-ink/80">{fmtTime(schedOut, 'paris')}</div>
          {realOut && realOut !== schedOut && (
            <div className="text-xs tabular-nums text-stamp-red">→ {fmtTime(realOut, 'paris')}</div>
          )}
          {depDelay && <div className="text-xs text-stamp-red mt-0.5">{depDelay}</div>}
        </div>

        <div className="flex flex-col items-center text-ocean/60">
          <Icon icon="lucide:plane" className="text-2xl rotate-90" />
        </div>

        <div className="text-right">
          <div className="font-handwritten font-bold text-3xl sm:text-4xl text-ink leading-none">{leg.to.code}</div>
          <div className="text-xs text-ink/50 mt-1">{leg.to.city}</div>
          <div className="mt-2 text-sm tabular-nums text-ink/80">{fmtTime(schedIn, arrivalTz)}</div>
          {realIn && realIn !== schedIn && (
            <div className="text-xs tabular-nums text-stamp-red">→ {fmtTime(realIn, arrivalTz)}</div>
          )}
          {arrDelay && <div className="text-xs text-stamp-red mt-0.5">{arrDelay}</div>}
        </div>
      </div>

      {inFlight && status && (
        <div className="mb-3">
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-ocean transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, status.progressPercent))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-ink/50 tabular-nums">{status.progressPercent}%</span>
            {status.lastPosition && (
              <span className="text-[10px] text-ink/50 tabular-nums">
                {Math.round(status.lastPosition.altitude * 100)} ft · {Math.round(status.lastPosition.groundspeed)} kt
              </span>
            )}
          </div>
        </div>
      )}

      {status &&
        (status.gateOrigin || status.terminalOrigin || status.gateDestination || status.terminalDestination) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/60">
            {status.terminalOrigin && (
              <span>
                T{status.terminalOrigin} <span className="text-ink/40">dép.</span>
              </span>
            )}
            {status.gateOrigin && (
              <span>
                Porte <span className="font-medium text-ink">{status.gateOrigin}</span>
              </span>
            )}
            <span className="text-ink/30">·</span>
            {status.terminalDestination && (
              <span>
                T{status.terminalDestination} <span className="text-ink/40">arr.</span>
              </span>
            )}
            {status.gateDestination && (
              <span>
                Porte <span className="font-medium text-ink">{status.gateDestination}</span>
              </span>
            )}
          </div>
        )}

      {variant === 'detailed' && status && (
        <div className="mt-3 pt-3 border-t border-kraft/40 text-xs text-ink/50">
          {arrived ? (
            <span>Atterri à {fmtTime(status.actualOn ?? status.actualIn, arrivalTz)}</span>
          ) : (
            <span>Statut AeroAPI : {status.status}</span>
          )}
        </div>
      )}
    </div>
  );
}
