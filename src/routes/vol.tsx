import * as React from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { FLIGHTS, GROUPS, flightsForGroup, membersInGroup, type FlightGroup, type FlightLeg } from '~/data/trip';
import { computeCountdownTarget, derivePhase, type Phase } from '~/lib/flight';
import { useFlightStatus, type FlightStatusResult } from '~/lib/use-flight-status';
import { FlightCard } from '~/components/flight-card';

function useCountdown(target: Date | null) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function formatCountdown(c: { days: number; hours: number; minutes: number; seconds: number }) {
  if (c.days > 0) return `${c.days}j ${c.hours}h ${c.minutes}m`;
  return `${c.hours > 0 ? `${c.hours}h ` : ''}${String(c.minutes).padStart(2, '0')}m ${String(c.seconds).padStart(2, '0')}s`;
}

function arrivalTzFor(code: string): 'paris' | 'tokyo' {
  return code === 'HND' || code === 'NRT' ? 'tokyo' : 'paris';
}

function phaseLabel(phase: Phase): { title: string; emoji: string; subtitle: string } {
  if (phase === 'pre') return { emoji: '⏳', title: 'Avant le départ', subtitle: '' };
  if (phase === 'lh1071') return { emoji: '🛫', title: 'Première étape en vol', subtitle: 'En route vers le hub' };
  if (phase === 'layover') return { emoji: '☕', title: 'Escale', subtitle: 'En attente du long courrier' };
  if (phase === 'lh716') return { emoji: '✈️', title: 'Long courrier en vol', subtitle: 'Direction Tokyo Haneda' };
  return { emoji: '🗾', title: 'Atterri à Tokyo', subtitle: 'いってきます !' };
}

function Timeline({ phase, legs }: { phase: Phase; legs: FlightLeg[] }) {
  const order: Phase[] = ['pre', 'lh1071', 'layover', 'lh716', 'arrived'];
  const currentIdx = order.indexOf(phase);
  const steps = [
    { label: legs[0]?.from.code ?? '—', emoji: '🛫' },
    { label: 'En vol', emoji: '✈️' },
    { label: legs[0]?.to.code ?? legs[1]?.from.code ?? '—', emoji: '☕' },
    { label: 'En vol', emoji: '✈️' },
    { label: legs[1]?.to.code ?? '—', emoji: '🗾' },
  ];

  return (
    <div className="paper-card rounded-xl p-3 sm:p-4 bg-paper">
      <div className="flex items-center justify-between gap-1 sm:gap-3 relative">
        <div className="absolute left-4 right-4 top-4 sm:top-5 h-0.5 bg-ink/10 -z-0" />
        <div
          className="absolute left-4 top-4 sm:top-5 h-0.5 bg-ocean -z-0 transition-all duration-700"
          style={{ width: `calc(${(currentIdx / (steps.length - 1)) * 100}% - 1rem)` }}
        />
        {steps.map((step, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          let circleClasses = 'bg-paper border-2 border-ink/15 text-ink/30';
          if (isCurrent) circleClasses = 'bg-ocean text-paper scale-110';
          else if (isPast) circleClasses = 'bg-matcha/80 text-paper';

          let circleContent: React.ReactNode = '';
          if (isCurrent) circleContent = step.emoji;
          else if (isPast) circleContent = '✓';

          let labelClass = 'text-ink/60';
          if (isCurrent) labelClass = 'text-ink';
          else if (!isPast) labelClass = 'text-ink/30';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm shadow-sm transition-all ${circleClasses}`}
              >
                {circleContent}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${labelClass}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupSection({
  group,
  first,
  long,
}: {
  group: FlightGroup;
  first: FlightStatusResult;
  long: FlightStatusResult;
}) {
  const legs = flightsForGroup(group);
  const members = membersInGroup(group);
  const meta = GROUPS[group];

  const phase = derivePhase(first.data, long.data);
  const { target } = computeCountdownTarget(phase, first.data, long.data);
  const countdown = useCountdown(target);
  const tLabel = phaseLabel(phase);

  return (
    <section className="mb-8">
      <header className="flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <div>
            <h2 className="font-handwritten text-xl sm:text-2xl font-bold text-ink leading-tight">{meta.label}</h2>
            <p className="text-xs text-ink/50">
              {tLabel.emoji} {tLabel.title}
              {countdown && phase !== 'arrived' && <> · dans {formatCountdown(countdown)}</>}
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.map((m) => (
            <div
              key={m.name}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
              style={{ backgroundColor: `${m.color}20`, borderColor: m.color }}
              title={m.name}
            >
              {m.emoji}
            </div>
          ))}
        </div>
      </header>

      <div className="mb-3">
        <Timeline phase={phase} legs={legs} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FlightCard
          leg={legs[0]}
          status={first.data}
          loaded={first.loaded}
          arrivalTz={arrivalTzFor(legs[0].to.code)}
          variant="detailed"
        />
        <FlightCard
          leg={legs[1]}
          status={long.data}
          loaded={long.loaded}
          arrivalTz={arrivalTzFor(legs[1].to.code)}
          variant="detailed"
        />
      </div>
    </section>
  );
}

function StatusFooter({ results }: { results: FlightStatusResult[] }) {
  const anyMocked = results.some((r) => r.isMocked);
  const fetching = results.some((r) => r.isFetching);
  const anyError = results.some((r) => r.error);
  const allStatic = results.every((r) => r.source === 'static');

  let content: React.ReactNode;
  if (anyMocked) {
    content = (
      <span className="flex items-center gap-1 text-stamp-red">
        <Icon icon="lucide:wrench" /> Mode dev : preview forcée
      </span>
    );
  } else if (fetching) {
    content = (
      <span className="flex items-center gap-1">
        <Icon icon="lucide:loader" className="animate-spin" /> Actualisation…
      </span>
    );
  } else if (anyError) {
    content = (
      <span className="flex items-center gap-1 text-stamp-red/80">
        <Icon icon="lucide:alert-circle" /> Données partielles
      </span>
    );
  } else if (allStatic) {
    content = (
      <span className="flex items-center gap-1">
        <Icon icon="lucide:database" className="text-ink/50" /> Horaires programmés (AeroAPI dispo dès J-2)
      </span>
    );
  } else {
    content = (
      <span className="flex items-center gap-1">
        <Icon icon="lucide:wifi" className="text-matcha" /> Live · refresh 60s
      </span>
    );
  }

  return <div className="flex items-center justify-center gap-2 text-xs text-ink/50 mt-2">{content}</div>;
}

export default function VolPage() {
  const lh1071 = useFlightStatus(FLIGHTS[0]);
  const lh716 = useFlightStatus(FLIGHTS[1]);
  const af7431 = useFlightStatus(FLIGHTS[2]);
  const af286 = useFlightStatus(FLIGHTS[3]);

  return (
    <div className="relative min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <header className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-2">✈️</div>
          <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-ink mb-1">Suivi des vols</h1>
          <p className="text-ink/50 text-sm">2 itinéraires · 19 mai 2026</p>
        </header>

        <GroupSection group="lh" first={lh1071} long={lh716} />
        <GroupSection group="af" first={af7431} long={af286} />

        <StatusFooter results={[lh1071, lh716, af7431, af286]} />
      </motion.div>
    </div>
  );
}
