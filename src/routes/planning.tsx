import { Card, CardBody, Chip } from '@heroui/react';
import { motion } from 'framer-motion';

import { ITINERARY, MEMBERS } from '~/data/trip';

export default function Planning() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-800 mb-2">
          <span className="text-ocean">Planning</span> du voyage
        </h1>
        <p className="text-gray-500 text-lg">17 jours a Tokyo et alentours</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {MEMBERS.map((m) => (
            <Chip key={m.name} size="sm" variant="flat" startContent={<span>{m.emoji}</span>}>
              {m.name}
            </Chip>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sakura via-ocean to-matcha" />

        <div className="space-y-6">
          {ITINERARY.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative flex gap-4 sm:gap-6">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-md border border-sakura/20 flex items-center justify-center text-2xl sm:text-3xl">
                    {day.emoji}
                  </div>
                </div>

                {/* Card */}
                <Card className="flex-1 bg-white/90 backdrop-blur border border-gray-100 hover:border-sakura/30 transition-all hover:shadow-md">
                  <CardBody className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Chip size="sm" color="danger" variant="flat" className="font-bold">
                            Jour {day.day}
                          </Chip>
                          <span className="text-sm text-gray-400">
                            {day.weekday} {day.date}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{day.location}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{day.description}</p>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Base info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center"
      >
        <Card className="bg-gradient-to-r from-sakura-light to-white border border-sakura/20">
          <CardBody className="p-6 text-center">
            <p className="text-2xl mb-2">🏨</p>
            <p className="font-bold text-gray-800">Base : Shinjuku</p>
            <p className="text-sm text-gray-500">Retour a Shinjuku chaque soir</p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
