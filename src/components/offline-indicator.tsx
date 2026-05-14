import * as React from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineIndicator() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    setOffline(!navigator.onLine);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 bg-stamp-red/15 text-stamp-red px-2.5 py-1 rounded-full text-xs font-medium"
          title="Mode hors ligne : dernières données en cache"
        >
          <Icon icon="lucide:wifi-off" />
          <span className="hidden sm:inline">Hors ligne</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
