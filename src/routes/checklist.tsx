import * as React from 'react';
import { Card, CardBody, CardHeader, Progress, Checkbox } from '@heroui/react';
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
        <h1 className="text-4xl sm:text-5xl font-black text-gray-800 mb-2">
          <span className="text-matcha">Checklist</span> valise
        </h1>
        <p className="text-gray-500 text-lg mb-6">Ne rien oublier pour le Japon !</p>

        {/* Progress bar */}
        <Card className="bg-white/90 border border-matcha/20">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Progression</span>
              <span className="text-sm font-bold text-matcha">
                {checkedCount} / {totalItems}
              </span>
            </div>
            <Progress
              value={progress}
              color="success"
              className="mb-2"
              size="lg"
            />
            {progress === 100 ? (
              <p className="text-matcha font-bold text-center mt-2">Tout est pret ! Bon voyage ! 🎉</p>
            ) : null}
          </CardBody>
        </Card>
      </motion.div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CHECKLIST_CATEGORIES.map((category, catIndex) => {
          const catChecked = category.items.filter((item) => checked[`${category.name}-${item}`]).length;

          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.08 }}
            >
              <Card className="bg-white/90 border border-gray-100 hover:border-sakura/20 transition-all h-full">
                <CardHeader className="pb-1 pt-4 px-5">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{category.emoji}</span>
                    <h3 className="text-lg font-bold text-gray-800 flex-1">{category.name}</h3>
                    <span className="text-xs font-medium text-gray-400">
                      {catChecked}/{category.items.length}
                    </span>
                  </div>
                </CardHeader>
                <CardBody className="px-5 pb-4 pt-2">
                  <div className="space-y-1">
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
                          className="w-full"
                          classNames={{
                            label: `text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`,
                          }}
                        >
                          {item}
                        </Checkbox>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
