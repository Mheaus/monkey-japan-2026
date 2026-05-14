import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { ARRIVAL_TIME, DEPARTURE_TIME, FLIGHTS, MEMBERS } from '~/data/trip';
import { computeCountdownTarget, derivePhase, fmtTime, type Phase } from '~/lib/flight';
import { useFlightStatus } from '~/lib/use-flight-status';

function useCountdown(target: Date | null) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isOver: true };
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isOver: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, total: diff, isOver: false };
}

function Unit({ value, label, size = 'lg' }: { value: number; label: string; size?: 'lg' | 'md' }) {
  const box =
    size === 'lg'
      ? 'w-[4.5rem] h-[4.5rem] sm:w-28 sm:h-28 text-2xl sm:text-5xl'
      : 'w-14 h-14 sm:w-20 sm:h-20 text-xl sm:text-4xl';
  const lbl = size === 'lg' ? 'text-[10px] sm:text-sm' : 'text-[10px] sm:text-xs';
  return (
    <div className="flex flex-col items-center">
      <div className={`paper-card rounded-xl flex items-center justify-center ${box}`}>
        <span className="font-handwritten font-bold text-ink tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className={`mt-1.5 font-handwritten font-medium text-ink/50 uppercase tracking-wider ${lbl}`}>{label}</span>
    </div>
  );
}

function Separator({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  return (
    <span
      className={`text-stamp-red font-handwritten font-bold ${
        size === 'lg' ? 'text-xl sm:text-3xl mt-[-20px]' : 'text-lg sm:text-2xl mt-[-12px]'
      }`}
    >
      :
    </span>
  );
}

function FloatingPetal({ delay, pct }: { delay: number; pct: number }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: `${pct}%` }}
      initial={{ y: -20, opacity: 0, rotate: 0 }}
      animate={{ y: '100vh', opacity: [0, 0.8, 0.8, 0], rotate: 360 }}
      transition={{ duration: 8 + delay, repeat: Infinity, delay, ease: 'linear' }}
    >
      🌸
    </motion.div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(2, Math.min(100, percent));
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-ocean/60 to-ocean rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[10px] uppercase tracking-wider text-ink/40 tabular-nums">
        <span>{Math.round(clamped)}%</span>
        <span>en vol</span>
      </div>
    </div>
  );
}

function VolLink() {
  return (
    <Link
      to="/vol"
      className="inline-flex items-center gap-1.5 mt-4 text-sm font-handwritten font-semibold text-ocean hover:text-stamp-red transition-colors"
    >
      Voir le vol en détail
      <Icon icon="lucide:arrow-right" />
    </Link>
  );
}

function CompactCountdown({ target }: { target: Date }) {
  const c = useCountdown(target);
  const showDays = c.days > 0;
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {showDays && (
        <>
          <Unit value={c.days} label="jours" size="md" />
          <Separator size="md" />
        </>
      )}
      <Unit value={c.hours} label="heures" size="md" />
      <Separator size="md" />
      <Unit value={c.minutes} label="min" size="md" />
      <Separator size="md" />
      <Unit value={c.seconds} label="sec" size="md" />
    </div>
  );
}

function HeroPre() {
  const c = useCountdown(DEPARTURE_TIME);
  return (
    <div className="text-center">
      <p className="font-handwritten text-base sm:text-lg text-ink/50 mb-3 uppercase tracking-[0.2em]">
        Décollage Bordeaux
      </p>
      <div className="flex items-center justify-center gap-1.5 sm:gap-5 mb-3">
        <Unit value={c.days} label="jours" />
        <Separator />
        <Unit value={c.hours} label="heures" />
        <Separator />
        <Unit value={c.minutes} label="minutes" />
        <Separator />
        <Unit value={c.seconds} label="secondes" />
      </div>
      <p className="text-sm text-ink/50 mt-4 font-handwritten">
        🛫 LH1071 · 19 mai · {fmtTime(DEPARTURE_TIME.toISOString(), 'paris')} (Paris)
      </p>
      <p className="text-xs text-ink/40 mt-1 font-handwritten">
        🐵 Mathieu : {FLIGHTS[2].ident} · {fmtTime(FLIGHTS[2].scheduledDeparture.toISOString(), 'paris')} (Paris)
      </p>
    </div>
  );
}

function HeroLh1071({ progress, target }: { progress: number; target: Date }) {
  return (
    <div className="text-center">
      <h2 className="font-handwritten text-3xl sm:text-5xl font-bold text-ink mb-2">En route 🛫</h2>
      <p className="text-ink/60 text-sm sm:text-base mb-5">Bordeaux → Francfort · LH1071</p>
      <div className="mb-6">
        <ProgressBar percent={progress} />
      </div>
      <p className="font-handwritten text-xs sm:text-sm text-ink/50 mb-2 uppercase tracking-wider">
        Atterrissage Francfort dans
      </p>
      <CompactCountdown target={target} />
      <VolLink />
    </div>
  );
}

function HeroLayover({ gate, terminal, target }: { gate: string | null; terminal: string | null; target: Date }) {
  return (
    <div className="text-center">
      <h2 className="font-handwritten text-3xl sm:text-5xl font-bold text-ink mb-2">Escale ☕</h2>
      <p className="text-ink/60 text-sm sm:text-base mb-5">Francfort · LH716 en attente</p>
      <p className="font-handwritten text-xs sm:text-sm text-ink/50 mb-2 uppercase tracking-wider">Décollage dans</p>
      <div className="mb-4">
        <CompactCountdown target={target} />
      </div>
      {(gate || terminal) && (
        <p className="text-sm text-ink/60 font-handwritten">
          {terminal && <>Terminal {terminal} · </>}
          {gate && (
            <>
              Porte <span className="font-bold text-ink">{gate}</span>
            </>
          )}
        </p>
      )}
      <VolLink />
    </div>
  );
}

function HeroLh716({ progress, target }: { progress: number; target: Date }) {
  return (
    <div className="text-center">
      <h2 className="font-handwritten text-3xl sm:text-5xl font-bold text-ink mb-2">Direction Tokyo 🌏</h2>
      <p className="text-ink/60 text-sm sm:text-base mb-5">Francfort → Haneda · LH716</p>
      <div className="mb-6">
        <ProgressBar percent={progress} />
      </div>
      <p className="font-handwritten text-xs sm:text-sm text-ink/50 mb-2 uppercase tracking-wider">
        Atterrissage Haneda dans
      </p>
      <CompactCountdown target={target} />
      <VolLink />
    </div>
  );
}

function HeroArrived({ arrivalIso }: { arrivalIso: string | null }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <div className="text-6xl sm:text-8xl mb-3">🗾</div>
      <h2 className="text-4xl sm:text-6xl font-handwritten font-bold text-torii mb-3">いってきます !</h2>
      <p className="text-ink/70 text-base sm:text-lg font-handwritten">
        Atterris à Tokyo {arrivalIso && <>à {fmtTime(arrivalIso, 'tokyo')}</>}
      </p>
    </motion.div>
  );
}

function Hero({
  phase,
  progress,
  gate,
  terminal,
  arrivalIso,
  target,
}: {
  phase: Phase;
  progress: number;
  gate: string | null;
  terminal: string | null;
  arrivalIso: string | null;
  target: Date | null;
}) {
  if (phase === 'arrived') return <HeroArrived arrivalIso={arrivalIso} />;
  if (phase === 'lh716' && target) return <HeroLh716 progress={progress} target={target} />;
  if (phase === 'layover' && target) return <HeroLayover gate={gate} terminal={terminal} target={target} />;
  if (phase === 'lh1071' && target) return <HeroLh1071 progress={progress} target={target} />;
  return <HeroPre />;
}

const quickLinks = [
  { to: '/vol', emoji: '✈️', title: 'Vol', subtitle: 'Live tracking', rotation: '-1deg', bg: 'bg-ocean/5' },
  { to: '/planning', emoji: '🗾', title: 'Planning', subtitle: '17 jours', rotation: '0.5deg', bg: 'bg-matcha/5' },
  { to: '/checklist', emoji: '🎒', title: 'Checklist', subtitle: 'Rien oublier', rotation: '-0.5deg', bg: 'bg-gold/5' },
  {
    to: '/calendrier',
    emoji: '📅',
    title: 'Calendrier',
    subtitle: 'Surprises',
    rotation: '1deg',
    bg: 'bg-sakura/10',
  },
];

export default function Home() {
  const lh1071 = useFlightStatus(FLIGHTS[0]);
  const lh716 = useFlightStatus(FLIGHTS[1]);

  const phase = derivePhase(lh1071.data, lh716.data);
  const { target } = computeCountdownTarget(phase, lh1071.data, lh716.data);

  const progress = phase === 'lh1071' ? (lh1071.data?.progressPercent ?? 0) : (lh716.data?.progressPercent ?? 0);
  const gate = lh716.data?.gateOrigin ?? null;
  const terminal = lh716.data?.terminalOrigin ?? null;
  const arrivalIso = lh716.data?.actualOn ?? lh716.data?.actualIn ?? ARRIVAL_TIME.toISOString();

  const petals = Array.from({ length: 12 }, (_, i) => ({ delay: i * 1.5, pct: (i / 12) * 100 }));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        {petals.map((p, i) => (
          <FloatingPetal key={i} delay={p.delay} pct={p.pct} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center w-full max-w-3xl"
        >
          <div className="relative inline-block mb-4">
            <h1 className="text-6xl sm:text-8xl font-handwritten font-bold text-ink leading-tight">Monkey Japan</h1>
            <div className="stamp absolute -top-2 -right-6 sm:-right-10 text-xs sm:text-sm">2026</div>
          </div>

          <p className="font-handwritten text-xl sm:text-2xl text-ink/60 mb-2">19 mai - 4 juin 2026</p>
          <p className="text-sm text-ink/40 mb-6">Tokyo & alentours</p>

          <div className="flex items-center justify-center gap-4 mb-10">
            {MEMBERS.map((m, i) => (
              <motion.div
                key={m.name}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? -1 : 1) * (2 + i) }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md polaroid !p-0"
                  style={{ backgroundColor: `${m.color}15`, border: `2px solid ${m.color}` }}
                >
                  {m.emoji}
                </div>
                <span className="text-xs font-handwritten font-semibold text-ink/70">{m.name}</span>
              </motion.div>
            ))}
          </div>

          <div className="mb-10">
            <Hero
              phase={phase}
              progress={progress}
              gate={gate}
              terminal={terminal}
              arrivalIso={arrivalIso}
              target={target}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl"
        >
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="group">
              <div
                className={`paper-card rounded-lg p-4 ${link.bg} transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full`}
                style={{ transform: `rotate(${link.rotation})` }}
              >
                <div className="flex flex-col items-center text-center gap-1.5">
                  <span className="text-3xl">{link.emoji}</span>
                  <div>
                    <h3 className="font-handwritten text-lg font-bold text-ink leading-tight">{link.title}</h3>
                    <p className="text-xs text-ink/50">{link.subtitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
