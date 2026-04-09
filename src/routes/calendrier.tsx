import * as React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

import { ADVENT_ITEMS, TRIP_START } from '~/data/trip';

const STORAGE_KEY = 'monkey-japan-advent';

function getDaysUntilTrip(): number {
  const now = new Date();
  const diff = TRIP_START.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getAdventStartDate(): Date {
  const start = new Date(TRIP_START);
  start.setDate(start.getDate() - ADVENT_ITEMS.length);
  return start;
}

function getDaysSinceAdventStart(): number {
  const start = getAdventStartDate();
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function useUnlockedDays() {
  const [unlockedCount, setUnlockedCount] = React.useState(0);
  const [openedDays, setOpenedDays] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { unlockedCount: number; openedDays: number[] };
        setUnlockedCount(data.unlockedCount ?? 0);
        setOpenedDays(new Set(data.openedDays ?? []));
      }
    } catch {
      // ignore
    }
  }, []);

  const save = React.useCallback((count: number, opened: Set<number>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlockedCount: count, openedDays: [...opened] }));
    } catch {
      // ignore
    }
  }, []);

  const syncUnlocked = React.useCallback(
    (timeBased: number) => {
      // Keep the max between time-based and previously saved count
      // This ensures days unlocked in the past stay unlocked even if the date logic would say otherwise
      const newCount = Math.max(timeBased, unlockedCount);
      if (newCount !== unlockedCount) {
        setUnlockedCount(newCount);
        save(newCount, openedDays);
      }
      return newCount;
    },
    [unlockedCount, openedDays, save],
  );

  const markOpened = React.useCallback(
    (day: number) => {
      setOpenedDays((prev) => {
        const next = new Set(prev);
        next.add(day);
        save(unlockedCount, next);
        return next;
      });
    },
    [unlockedCount, save],
  );

  return { unlockedCount, openedDays, syncUnlocked, markOpened };
}

export default function Calendrier() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDay, setSelectedDay] = React.useState<(typeof ADVENT_ITEMS)[number] | null>(null);
  const daysSinceStart = getDaysSinceAdventStart();
  const daysUntilTrip = getDaysUntilTrip();
  const { openedDays, syncUnlocked, markOpened } = useUnlockedDays();

  // Sync time-based unlock count with localStorage (keeps highest value)
  const effectiveUnlocked = syncUnlocked(daysSinceStart + 1);

  const adventStart = getAdventStartDate();
  const hasStarted = daysSinceStart >= 0;

  const openedCount = openedDays.size;
  const totalItems = ADVENT_ITEMS.length;

  const handleOpen = (item: (typeof ADVENT_ITEMS)[number]) => {
    markOpened(item.day);
    setSelectedDay(item);
    onOpen();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-5xl sm:text-6xl font-handwritten font-bold text-ink mb-1">
          Calendrier de l'avant
        </h1>
        <p className="font-handwritten text-xl text-ink/50 mb-2">
          Un nouveau contenu chaque jour avant le depart !
        </p>
        {!hasStarted ? (
          <div className="inline-block paper-card rounded-lg px-4 py-2 mt-2">
            <p className="text-sm text-ink/60">
              Le calendrier commence le{' '}
              <span className="font-handwritten font-bold text-ink">
                {adventStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="font-handwritten text-lg text-matcha font-bold">
              {daysUntilTrip > 0 ? `Plus que ${daysUntilTrip} jours !` : "C'est le moment !"}
            </p>
            <div className="paper-card rounded-lg px-4 py-2">
              <p className="text-sm text-ink/60">
                <span className="font-handwritten font-bold text-ink">{openedCount}</span> / {totalItems} ouverts
                {' '}&middot;{' '}
                <span className="font-handwritten font-bold text-ink">
                  {Math.min(effectiveUnlocked, totalItems)}
                </span>{' '}
                debloques
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Grid - like stickers on a page */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
        {ADVENT_ITEMS.map((item, index) => {
          const isUnlocked = index < effectiveUnlocked;
          const isToday = daysSinceStart === index;
          const isOpened = openedDays.has(item.day);
          const rotation = ((index * 7 + 3) % 7 - 3) * 0.8;

          return (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <button
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) handleOpen(item);
                }}
                className={`aspect-square w-full rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isToday
                    ? 'paper-card ring-2 ring-stamp-red shadow-lg animate-pulse'
                    : isUnlocked
                      ? 'paper-card hover:shadow-md hover:-translate-y-1'
                      : 'bg-kraft/30 border border-kraft/50 cursor-not-allowed opacity-50'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                    <span className="text-[9px] sm:text-xs font-handwritten font-semibold text-ink/60 text-center leading-tight">
                      {item.title}
                    </span>
                    {isOpened ? (
                      <span className="absolute top-1 right-1 text-matcha text-xs">&#10003;</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl">🔒</span>
                    <span className="text-xs font-handwritten font-bold text-ink/30">
                      J-{ADVENT_ITEMS.length - index}
                    </span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Modal - notebook page reveal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
        <ModalContent className="paper-card !bg-paper">
          <AnimatePresence>
            {selectedDay ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ModalHeader className="flex flex-col gap-1 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedDay.emoji}</span>
                    <div>
                      <span className="stamp text-[10px] !p-[1px_6px] !border-2">Jour {selectedDay.day}</span>
                      <h3 className="text-2xl font-handwritten font-bold text-ink mt-1">{selectedDay.title}</h3>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody className="pb-6 notebook-lines">
                  <p className="text-ink/80 leading-relaxed text-base">{selectedDay.content}</p>
                </ModalBody>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </ModalContent>
      </Modal>
    </div>
  );
}
