import * as React from 'react';
import { Checkbox, Progress } from '@heroui/react';
import { motion } from 'framer-motion';

import { CHECKLIST_CATEGORIES } from '~/data/trip';

function useCheckedItems() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('monkey-japan-checklist');
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggle = React.useCallback((key: string) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('monkey-japan-checklist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { checked, toggle };
}

export default function Checklist() {
  const { checked, toggle } = useCheckedItems();

  const totalItems = CHECKLIST_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-5xl sm:text-6xl font-handwritten font-bold text-ink mb-1">Checklist valise</h1>
        <p className="font-handwritten text-xl text-ink/50 mb-6">Ne rien oublier pour le Japon !</p>

        {/* Progress - notebook style */}
        <div className="paper-card rounded-lg p-5 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-handwritten text-ink/60">Progression</span>
            <span className="font-handwritten text-lg font-bold text-matcha">
              {checkedCount} / {totalItems}
            </span>
          </div>
          <Progress value={progress} color="success" size="lg" />
          {progress === 100 ? (
            <p className="font-handwritten text-xl text-matcha font-bold text-center mt-3">
              Tout est pret ! Bon voyage ! 🎉
            </p>
          ) : null}
        </div>
      </motion.div>

      {/* Categories - like torn notebook pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CHECKLIST_CATEGORIES.map((category, catIndex) => {
          const catChecked = category.items.filter((item) => checked[`${category.name}-${item}`]).length;
          const allDone = catChecked === category.items.length;

          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.08 }}
            >
              <div
                className={`paper-card rounded-lg overflow-hidden h-full ${allDone ? 'ring-2 ring-matcha/30' : ''}`}
                style={{ transform: `rotate(${((catIndex % 3) - 1) * 0.5}deg)` }}
              >
                {/* Header with washi tape effect */}
                <div className="bg-washi/30 px-5 py-3 border-b border-kraft/50">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{category.emoji}</span>
                    <h3 className="text-xl font-handwritten font-bold text-ink flex-1">{category.name}</h3>
                    <span className="font-handwritten text-sm text-ink/40">
                      {catChecked}/{category.items.length}
                    </span>
                    {allDone ? <span className="text-matcha">✓</span> : null}
                  </div>
                </div>
                <div className="px-5 pb-4 pt-3 notebook-lines">
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const key = `${category.name}-${item}`;
                      const isChecked = !!checked[key];
                      return (
                        <Checkbox
                          key={key}
                          isSelected={isChecked}
                          onValueChange={() => toggle(key)}
                          size="sm"
                          color="success"
                          className="w-full mr-4"
                          classNames={{
                            label: `text-sm ${isChecked ? 'line-through text-ink/30' : 'text-ink/70'}`,
                          }}
                        >
                          {item}
                        </Checkbox>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
