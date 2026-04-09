import * as React from 'react';
import { Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

import { ADVENT_ITEMS, TRIP_START } from '~/data/trip';

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

export default function Calendrier() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDay, setSelectedDay] = React.useState<(typeof ADVENT_ITEMS)[number] | null>(null);
  const daysSinceStart = getDaysSinceAdventStart();
  const daysUntilTrip = getDaysUntilTrip();

  const adventStart = getAdventStartDate();
  const hasStarted = daysSinceStart >= 0;

  const handleOpen = (item: (typeof ADVENT_ITEMS)[number]) => {
    setSelectedDay(item);
    onOpen();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-800 mb-2">
          <span className="text-gold">Calendrier</span> de l'avant
        </h1>
        <p className="text-gray-500 text-lg mb-2">Un nouveau contenu chaque jour avant le depart !</p>
        {!hasStarted ? (
          <p className="text-sm text-sakura-dark">
            Le calendrier commence le{' '}
            {adventStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} ({daysUntilTrip - ADVENT_ITEMS.length} jours)
          </p>
        ) : (
          <p className="text-sm text-matcha font-medium">
            {daysUntilTrip > 0 ? `Plus que ${daysUntilTrip} jours !` : "C'est le moment !"}
          </p>
        )}
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
        {ADVENT_ITEMS.map((item, index) => {
          const isUnlocked = daysSinceStart > index;
          const isToday = daysSinceStart === index;

          return (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                isPressable={isUnlocked || isToday}
                onPress={() => {
                  if (isUnlocked || isToday) handleOpen(item);
                }}
                className={`aspect-square transition-all ${
                  isToday
                    ? 'bg-gradient-to-br from-sakura-light to-white border-2 border-sakura-dark shadow-lg shadow-sakura/20 animate-pulse'
                    : isUnlocked
                      ? 'bg-white border border-sakura/20 hover:border-sakura/50 hover:shadow-md hover:-translate-y-1'
                      : 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-60'
                }`}
              >
                <CardBody className="flex flex-col items-center justify-center p-2 gap-1">
                  {isUnlocked || isToday ? (
                    <>
                      <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 text-center leading-tight">
                        {item.title}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl">🔒</span>
                      <span className="text-xs font-bold text-gray-400">J-{ADVENT_ITEMS.length - index}</span>
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
        <ModalContent>
          <AnimatePresence>
            {selectedDay ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ModalHeader className="flex flex-col gap-1 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedDay.emoji}</span>
                    <div>
                      <p className="text-xs text-sakura-dark font-medium">Jour {selectedDay.day}</p>
                      <h3 className="text-xl font-bold text-gray-800">{selectedDay.title}</h3>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody className="pb-6">
                  <p className="text-gray-700 leading-relaxed text-base">{selectedDay.content}</p>
                </ModalBody>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </ModalContent>
      </Modal>
    </div>
  );
}
