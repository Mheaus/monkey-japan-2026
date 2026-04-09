import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { TRIP_START, MEMBERS } from '~/data/trip';

function useCountdown(target: Date) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isOver: false };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="paper-card rounded-xl w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
        <span className="text-3xl sm:text-5xl font-handwritten font-bold text-ink tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-xs sm:text-sm font-handwritten font-medium text-ink/50 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function FloatingPetal({ delay, pct }: { delay: number; pct: number }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: `${pct}%` }}
      initial={{ y: -20, opacity: 0, rotate: 0 }}
      animate={{
        y: '100vh',
        opacity: [0, 0.8, 0.8, 0],
        rotate: 360,
      }}
      transition={{
        duration: 8 + delay,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
    >
      🌸
    </motion.div>
  );
}

const quickLinks = [
  {
    to: '/planning',
    emoji: '🗾',
    title: 'Planning',
    subtitle: '17 jours d\'aventure',
    rotation: '-1deg',
    bg: 'bg-ocean/5',
  },
  {
    to: '/checklist',
    emoji: '🎒',
    title: 'Checklist',
    subtitle: 'Rien oublier',
    rotation: '1deg',
    bg: 'bg-matcha/5',
  },
  {
    to: '/calendrier',
    emoji: '📅',
    title: 'Calendrier',
    subtitle: 'Surprises quotidiennes',
    rotation: '-0.5deg',
    bg: 'bg-gold/5',
  },
];

export default function Home() {
  const countdown = useCountdown(TRIP_START);

  const petals = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.5,
    pct: (i / 12) * 100,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating sakura petals */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {petals.map((p, i) => (
          <FloatingPetal key={i} delay={p.delay} pct={p.pct} />
        ))}
      </div>

      {/* Hero section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Title - carnet de voyage style */}
          <div className="relative inline-block mb-4">
            <h1 className="text-6xl sm:text-8xl font-handwritten font-bold text-ink leading-tight">
              Monkey Japan
            </h1>
            <div className="stamp absolute -top-2 -right-6 sm:-right-10 text-xs sm:text-sm">2026</div>
          </div>

          <p className="font-handwritten text-xl sm:text-2xl text-ink/60 mb-2">
            19 mai - 4 juin 2026
          </p>
          <p className="text-sm text-ink/40 mb-6">Tokyo & alentours</p>

          {/* Members - like stickers on a notebook */}
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

          {/* Countdown */}
          {countdown.isOver ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl sm:text-6xl font-handwritten font-bold text-torii mb-8"
            >
              C'est parti ! いってきます!
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-5 mb-10">
              <CountdownUnit value={countdown.days} label="jours" />
              <span className="text-3xl text-stamp-red font-handwritten font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.hours} label="heures" />
              <span className="text-3xl text-stamp-red font-handwritten font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.minutes} label="minutes" />
              <span className="text-3xl text-stamp-red font-handwritten font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.seconds} label="secondes" />
            </div>
          )}
        </motion.div>

        {/* Quick links - notebook cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl"
        >
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="group">
              <div
                className={`paper-card rounded-lg p-5 ${link.bg} transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
                style={{ transform: `rotate(${link.rotation})` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{link.emoji}</span>
                  <div>
                    <h3 className="font-handwritten text-xl font-bold text-ink">{link.title}</h3>
                    <p className="text-sm text-ink/50">{link.subtitle}</p>
                  </div>
                  <Icon
                    icon="lucide:chevron-right"
                    className="ml-auto text-ink/30 group-hover:text-torii transition-colors"
                  />
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
