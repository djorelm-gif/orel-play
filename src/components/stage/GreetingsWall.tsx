'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Greeting } from '@/types/greeting';
import { Avatar } from '@/components/ui/Avatar';

export function GreetingsWall({ greetings, childName }: { greetings: Greeting[]; childName: string }) {
  const visible = greetings.slice(0, 8);

  return (
    <div className="relative z-10 flex h-full flex-col px-16 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="chip mb-2">
            <span className="size-2 rounded-full bg-magenta animate-pulse" />
            <span className="tracking-[0.3em]">ברכות חיות</span>
          </div>
          <h1 className="stage-headline font-display gold-shimmer leading-none">
            ברכות ל{childName}
          </h1>
        </div>
        <p className="stage-subheadline text-muted max-w-md text-end">
          הברכות עברו אישור על ידי המנחה. שלחו עוד דרך הטלפון!
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 content-start auto-rows-min overflow-hidden">
        <AnimatePresence mode="popLayout">
          {visible.map((g, i) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26, delay: i * 0.04 }}
              className="panel-strong flex items-start gap-4 p-5"
            >
              <Avatar name={g.display_name} photoUrl={g.photo_url} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gold-light text-lg">{g.display_name}</div>
                <div className="mt-1 text-white text-xl leading-snug text-balance">{g.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="col-span-2 panel p-12 text-center text-2xl text-muted">
            עדיין לא הגיעו ברכות מאושרות. בקרוב יתחיל הקסם 💫
          </div>
        )}
      </div>
    </div>
  );
}
