import { Chip } from '@heroui/react';
import { motion } from 'framer-motion';

import { ITINERARY, MEMBERS } from '~/data/trip';

export default function Planning() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header - notebook style */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-5xl sm:text-6xl font-handwritten font-bold text-ink mb-1">
          Planning du voyage
        </h1>
        <p className="font-handwritten text-xl text-ink/50">17 jours a Tokyo et alentours</p>
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {MEMBERS.map((m) => (
            <span key={m.name} className="inline-flex items-center gap-1 text-sm font-handwritten text-ink/60">
              {m.emoji} {m.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Timeline - journal entries */}
      <div className="relative">
        {/* Vertical line - like notebook binding */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-kraft" />

        <div className="space-y-5">
          {ITINERARY.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative flex gap-4 sm:gap-6">
                {/* Timeline dot - stamp style */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg paper-card flex items-center justify-center text-2xl sm:text-3xl"
                    style={{ transform: `rotate(${(index % 3 - 1) * 2}deg)` }}
                  >
                    {day.emoji}
                  </div>
                </div>

                {/* Card - journal entry */}
                <div
                  className="flex-1 paper-card rounded-lg p-4 sm:p-5 hover:shadow-md transition-all notebook-lines"
                  style={{ transform: `rotate(${(index % 2 === 0 ? -0.3 : 0.3)}deg)` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="stamp text-[10px] !p-[1px_6px] !border-2">Jour {day.day}</span>
                        <span className="text-sm font-handwritten text-ink/40">
                          {day.weekday} {day.date}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-handwritten font-bold text-ink">{day.location}</h3>
                    </div>
                  </div>
                  <p className="text-ink/70 text-sm sm:text-base leading-relaxed">{day.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Base info - like a sticky note */}
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
  );
}
