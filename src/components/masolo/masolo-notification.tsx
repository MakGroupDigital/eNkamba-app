'use client';

import { type NotificationState } from '@/app/dashboard/layout';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function MasoloNotification({
  notification,
}: {
  notification: NotificationState | null;
}) {
  const showMessage = notification && notification.message;

  return (
    <AnimatePresence>
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive shadow-lg backdrop-blur-sm',
            'border border-destructive/20'
          )}
        >
          {notification.message} -{' '}
          <span className="font-bold">{notification.source}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
