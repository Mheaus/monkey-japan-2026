import * as React from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

import { useDevPhase } from '~/lib/dev-phase';
import type { Phase } from '~/lib/flight';

const PHASES: { value: Phase; label: string; emoji: string; description: string }[] = [
  { value: 'pre', label: 'Avant départ', emoji: '⏳', description: 'Horaires programmés' },
  { value: 'lh1071', label: 'Première étape en vol', emoji: '🛫', description: 'BOD → FRA / CDG' },
  { value: 'layover', label: 'Escale', emoji: '☕', description: 'À FRA / CDG' },
  { value: 'lh716', label: 'Long courrier en vol', emoji: '✈️', description: 'Direction Tokyo' },
  { value: 'arrived', label: 'Atterri Tokyo', emoji: '🗾', description: 'いってきます !' },
];

const DELAYS = [
  { value: 0, label: 'À l’heure' },
  { value: 15, label: '+15 min' },
  { value: 30, label: '+30 min' },
  { value: 60, label: '+1 h' },
  { value: 120, label: '+2 h' },
];

export function DevPhaseToolbar() {
  const { phase, setPhase, delayMin, setDelayMin, cancelled, setCancelled, reset } = useDevPhase();
  const [open, setOpen] = React.useState(false);

  if (!import.meta.env.DEV) return null;

  const active = phase !== null || delayMin > 0 || cancelled;

  return (
    <div className="fixed bottom-4 right-4 z-[60] pointer-events-auto">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="paper-card rounded-xl p-3 mb-2 w-80 shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Icon icon="lucide:wrench" className="text-stamp-red" />
                <span className="font-handwritten font-bold text-ink">Dev — preview vol</span>
              </div>
              {active && (
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-wider text-stamp-red hover:underline"
                  onClick={reset}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">Phase</p>
              <div className="grid gap-1">
                {PHASES.map((p) => {
                  const isActive = phase === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPhase(isActive ? null : p.value)}
                      className={`flex items-start gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                        isActive ? 'bg-washi/70 border border-kraft' : 'hover:bg-washi/30 border border-transparent'
                      }`}
                    >
                      <span className="text-base leading-none mt-0.5">{p.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink">{p.label}</div>
                        <div className="text-ink/50 text-[11px]">{p.description}</div>
                      </div>
                      {isActive && <Icon icon="lucide:check" className="text-matcha" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-3 pt-3 border-t border-kraft/40">
              <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">Retard</p>
              <div className="flex flex-wrap gap-1">
                {DELAYS.map((d) => {
                  const isActive = delayMin === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDelayMin(d.value)}
                      className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                        isActive
                          ? 'bg-stamp-red/15 border-stamp-red text-stamp-red'
                          : 'border-kraft/60 text-ink/60 hover:bg-washi/40'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-kraft/40">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink/40">Annulation</p>
                  <p className="text-xs text-ink/70">Marquer le vol comme annulé</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={cancelled}
                  onClick={() => setCancelled(!cancelled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    cancelled ? 'bg-stamp-red' : 'bg-ink/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-paper rounded-full shadow-sm transition-transform ${
                      cancelled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="mt-3 pt-2 border-t border-kraft/40 flex items-center justify-between">
              <span className="text-[10px] text-ink/40">visible en dev uniquement</span>
              {active && (
                <span className="text-[10px] font-medium text-stamp-red bg-stamp-red/10 px-2 py-0.5 rounded-full">
                  MOCK ACTIF
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 paper-card rounded-full px-3 py-2 shadow-lg transition-all ${
          active ? 'bg-stamp-red/15 border-stamp-red' : 'hover:scale-105'
        }`}
        title="Dev: preview vol"
      >
        <Icon icon={open ? 'lucide:x' : 'lucide:wrench'} className={active ? 'text-stamp-red' : 'text-ink/70'} />
        <span className="font-handwritten text-sm font-semibold text-ink">
          {active
            ? `mock${phase ? `: ${phase}` : ''}${delayMin ? ` +${delayMin}m` : ''}${cancelled ? ' annulé' : ''}`
            : 'dev'}
        </span>
      </button>
    </div>
  );
}
