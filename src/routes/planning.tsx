import * as React from 'react';
import { motion } from 'framer-motion';

import { ITINERARY } from '~/data/trip';

const JapanMap = React.lazy(() => import('~/components/japan-map'));

const PLANNING_STORAGE_KEY = 'monkey-japan-planning-seen';

function useSeenDays() {
  const [seenDays, setSeenDays] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PLANNING_STORAGE_KEY);
      if (saved) {
        setSeenDays(new Set(JSON.parse(saved) as number[]));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSeen = React.useCallback((day: number) => {
    setSeenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      try {
        localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { seenDays, toggleSeen };
}

export default function Planning() {
  const { seenDays, toggleSeen } = useSeenDays();
  const [view, setView] = React.useState<'list' | 'map'>('map');
  const [activeDay, setActiveDay] = React.useState<number | null>(null);

  const listRef = React.useRef<HTMLDivElement>(null);

  function scrollToDay(day: number) {
    setActiveDay(day);
    const el = listRef.current?.querySelector(`[data-day="${day}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className={`max-w-7xl mx-auto ${
      view === 'map'
        ? 'p-4 flex flex-col overflow-hidden'
        : 'px-4 py-8 sm:py-12'
    }`}
      style={view === 'map' ? { height: 'calc(100dvh - 64px)' } : undefined}
    >
      {/* Switch — masqué sur mobile en vue carte (flottant sur la map à la place) */}
      <div className={`shrink-0 flex items-center justify-center ${view === 'map' ? 'hidden lg:flex py-3' : 'mb-8 mt-8'}`}>
        <div className="paper-card rounded-xl p-1 flex gap-1 border border-kraft">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-5 py-2 rounded-lg font-handwritten text-base font-bold transition-all ${
              view === 'list' ? 'bg-torii text-white shadow-sm' : 'text-ink/50 hover:text-ink'
            }`}
          >
            📋 Liste
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`px-5 py-2 rounded-lg font-handwritten text-base font-bold transition-all ${
              view === 'map' ? 'bg-torii text-white shadow-sm' : 'text-ink/50 hover:text-ink'
            }`}
          >
            🗾 Carte
          </button>
        </div>
      </div>

      {/* MAP VIEW */}
      {view === 'map' ? (
        <motion.div
          key="map"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 pb-4"
        >
          {/* Map — pleine hauteur sur mobile */}
          <div className="flex-1 lg:flex-2 relative min-h-0 h-full">
            <React.Suspense
              fallback={
                <div className="w-full h-full paper-card rounded-xl flex items-center justify-center">
                  <span className="font-handwritten text-xl text-ink/40 animate-pulse">Chargement de la carte…</span>
                </div>
              }
            >
              <JapanMap
                days={ITINERARY}
                activeDay={activeDay}
                onDayClick={scrollToDay}
              />
            </React.Suspense>

            {/* Switch flottant mobile — en bas de la map */}
            <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
              <div className="paper-card rounded-xl p-1 flex gap-1 border border-kraft shadow-lg">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-1.5 rounded-lg font-handwritten text-sm font-bold text-ink/50 hover:text-ink transition-all"
                >
                  📋 Liste
                </button>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg font-handwritten text-sm font-bold bg-torii text-white shadow-sm"
                  onClick={() => setView('map')}
                >
                  🗾 Carte
                </button>
              </div>
            </div>

            {/* Popup mobile — s'affiche en haut de la map quand un pin est sélectionné */}
            {activeDay !== null ? (() => {
              const day = ITINERARY.find((d) => d.day === activeDay);
              if (!day) return null;
              return (
                <motion.div
                  key={activeDay}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:hidden absolute top-3 left-3 right-3 z-30 paper-card rounded-xl px-3 py-2 border border-kraft shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl shrink-0 mt-0.5">{day.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="stamp text-[9px] p-[1px_5px]! border-[1.5px]! shrink-0">J{day.day}</span>
                        <span className="text-xs font-handwritten text-ink/40">{day.weekday} {day.date}</span>
                      </div>
                      <p className="font-handwritten font-bold text-ink text-sm leading-tight">{day.location}</p>
                      <p className="text-ink/60 text-xs leading-snug mt-0.5 line-clamp-2">{day.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDay(null)}
                      className="text-ink/30 hover:text-ink text-lg leading-none shrink-0 -mt-0.5"
                    >×</button>
                  </div>
                </motion.div>
              );
            })() : null}
          </div>

          {/* Sidebar — cachée sur mobile, visible lg+ */}
          <div
            ref={listRef}
            className="hidden lg:flex lg:w-72 xl:w-80 overflow-y-auto flex-col gap-2 pr-1"
            style={{ maxHeight: '100%' }}
          >
            {ITINERARY.map((day) => {
              const isSeen = seenDays.has(day.day);
              const isActive = activeDay === day.day;
              return (
                <button
                  key={day.day}
                  type="button"
                  data-day={day.day}
                  onClick={() => {
                    setActiveDay(day.day);
                    toggleSeen(day.day);
                  }}
                  className={`paper-card rounded-lg px-3 py-2 text-left transition-all flex items-start gap-3 border ${
                    isActive
                      ? 'border-torii shadow-md bg-sakura-light/30'
                      : 'border-kraft hover:border-torii/40 hover:shadow-sm'
                  } ${isSeen ? 'opacity-60' : ''}`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{day.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="stamp text-[9px] p-[1px_5px]! border-[1.5px]! shrink-0">
                        J{day.day}
                      </span>
                      <span className="text-xs font-handwritten text-ink/40 truncate">
                        {day.weekday} {day.date}
                      </span>
                    </div>
                    <p className="font-handwritten font-bold text-ink text-sm leading-tight mb-1">
                      {day.location}
                    </p>
                    <p className="text-ink/60 text-xs leading-snug line-clamp-3">{day.description}</p>
                  </div>
                  {isSeen ? <span className="text-matcha text-sm shrink-0 mt-0.5">✓</span> : null}
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      {/* LIST VIEW */}
      {view === 'list' ? (
        <motion.div key="list" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="max-w-4xl mx-auto">
            {/* Timeline - journal entries */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-kraft" />

              <div className="space-y-5">
                {ITINERARY.map((day, index) => {
                  const isSeen = seenDays.has(day.day);
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="relative flex gap-4 sm:gap-6">
                        {/* Timeline dot */}
                        <div className="relative z-10 shrink-0">
                          <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg paper-card flex items-center justify-center text-2xl sm:text-3xl transition-opacity ${isSeen ? 'opacity-50' : ''}`}
                            style={{ transform: `rotate(${(index % 3 - 1) * 2}deg)` }}
                          >
                            {day.emoji}
                          </div>
                        </div>

                        {/* Card */}
                        <button
                          type="button"
                          onClick={() => toggleSeen(day.day)}
                          className={`flex-1 paper-card rounded-lg p-4 sm:p-5 hover:shadow-md transition-all notebook-lines text-left relative ${isSeen ? 'opacity-60' : ''}`}
                          style={{ transform: `rotate(${(index % 2 === 0 ? -0.3 : 0.3)}deg)` }}
                        >
                          {isSeen ? <span className="absolute top-2 right-2 text-matcha text-sm">&#10003;</span> : null}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="stamp text-[10px] p-[1px_6px]! border-2!">Jour {day.day}</span>
                                <span className="text-sm font-handwritten text-ink/40">
                                  {day.weekday} {day.date}
                                </span>
                              </div>
                              <h3 className="text-xl sm:text-2xl font-handwritten font-bold text-ink">{day.location}</h3>
                            </div>
                          </div>
                          <p className="text-ink/70 text-sm sm:text-base leading-relaxed">{day.description}</p>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Sticky note base */}
            <motion.div
              initial={{ opacity: 0, rotate: -2 }}
              animate={{ opacity: 1, rotate: -1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 max-w-xs mx-auto"
            >
              <div className="bg-[#fff9c4] p-5 shadow-md rounded-sm relative" style={{ transform: 'rotate(-1deg)' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-4 bg-washi/80 rounded-sm" />
                <p className="text-2xl text-center mb-1">🏨</p>
                <p className="font-handwritten text-xl font-bold text-center text-ink">Base : Shinjuku</p>
                <p className="text-sm text-ink/60 text-center">Retour chaque soir</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
