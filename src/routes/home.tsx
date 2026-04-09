import * as React from 'react';
import { Link } from 'react-router';
import { Card, CardBody } from '@heroui/react';
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
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-lg border border-sakura/20 w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
          <span className="text-3xl sm:text-5xl font-bold text-gray-800 tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function FloatingPetal({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="absolute text-sakura text-2xl pointer-events-none select-none"
      initial={{ y: -20, x, opacity: 0, rotate: 0 }}
      animate={{
        y: '100vh',
        opacity: [0, 1, 1, 0],
        rotate: 360,
        x: x + Math.sin(delay) * 100,
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

export default function Home() {
  const countdown = useCountdown(TRIP_START);

  const petals = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      delay: i * 1.5,
      x: (i / 12) * (typeof window !== 'undefined' ? window.innerWidth : 1200),
    }));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating sakura petals */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {petals.map((p, i) => (
          <FloatingPetal key={i} delay={p.delay} x={p.x} />
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
          {/* Title */}
          <h1 className="text-5xl sm:text-7xl font-black text-gray-800 mb-2">
            <span className="text-torii">Monkey</span> Japan
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-2">19 mai - 4 juin 2026 / Tokyo & alentours</p>

          {/* Members */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {MEMBERS.map((m) => (
              <div key={m.name} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
                  style={{ backgroundColor: `${m.color}20`, border: `2px solid ${m.color}` }}
                >
                  {m.emoji}
                </div>
                <span className="text-xs font-medium text-gray-600">{m.name}</span>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {countdown.isOver ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl sm:text-6xl font-black text-torii mb-8"
            >
              C'est parti ! いってきます!
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-5 mb-10">
              <CountdownUnit value={countdown.days} label="jours" />
              <span className="text-3xl text-sakura-dark font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.hours} label="heures" />
              <span className="text-3xl text-sakura-dark font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.minutes} label="minutes" />
              <span className="text-3xl text-sakura-dark font-bold mt-[-20px]">:</span>
              <CountdownUnit value={countdown.seconds} label="secondes" />
            </div>
          )}
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl"
        >
          <Link to="/planning" className="group">
            <Card className="bg-white/80 backdrop-blur border border-sakura/10 hover:border-sakura/40 transition-all hover:shadow-lg hover:-translate-y-1">
              <CardBody className="flex flex-row items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-ocean/10 flex items-center justify-center text-2xl shrink-0">
                  🗾
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Planning</h3>
                  <p className="text-sm text-gray-500">17 jours d'aventure</p>
                </div>
                <Icon icon="lucide:chevron-right" className="ml-auto text-gray-400 group-hover:text-sakura-dark transition-colors" />
              </CardBody>
            </Card>
          </Link>

          <Link to="/checklist" className="group">
            <Card className="bg-white/80 backdrop-blur border border-sakura/10 hover:border-sakura/40 transition-all hover:shadow-lg hover:-translate-y-1">
              <CardBody className="flex flex-row items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-matcha/10 flex items-center justify-center text-2xl shrink-0">
                  🎒
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Checklist</h3>
                  <p className="text-sm text-gray-500">Rien oublier</p>
                </div>
                <Icon icon="lucide:chevron-right" className="ml-auto text-gray-400 group-hover:text-sakura-dark transition-colors" />
              </CardBody>
            </Card>
          </Link>

          <Link to="/calendrier" className="group">
            <Card className="bg-white/80 backdrop-blur border border-sakura/10 hover:border-sakura/40 transition-all hover:shadow-lg hover:-translate-y-1">
              <CardBody className="flex flex-row items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-2xl shrink-0">
                  📅
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Calendrier</h3>
                  <p className="text-sm text-gray-500">Surprises quotidiennes</p>
                </div>
                <Icon icon="lucide:chevron-right" className="ml-auto text-gray-400 group-hover:text-sakura-dark transition-colors" />
              </CardBody>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
