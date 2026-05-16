'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Greeting } from '@/types/greeting';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  greetings: Greeting[];
  childName: string;
  joinUrl: string;
  eventCode: string;
}

export function GreetingsWall({ greetings, childName, joinUrl, eventCode }: Props) {
  // Two columns of bubbles + a sidebar with the QR so latecomers can still
  // scan and join from across the hall while the wall is up.
  const visible = greetings.slice(0, 6);

  return (
    <div className="relative z-10 grid h-full grid-cols-12 gap-8 px-12 py-8">
      {/* Greetings column */}
      <div className="col-span-8 flex flex-col">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="chip mb-2">
              <span className="size-2 rounded-full bg-magenta animate-pulse" />
              <span className="tracking-[0.3em]">ברכות חיות</span>
            </div>
            <h1 className="font-display gold-shimmer leading-none"
                style={{ fontSize: 'clamp(48px, 6vw, 96px)' }}>
              ברכות ל{childName}
            </h1>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 content-start auto-rows-min overflow-hidden">
          <AnimatePresence mode="popLayout">
            {visible.map((g, i) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26, delay: i * 0.04 }}
                className="panel-strong flex items-start gap-3 p-4"
              >
                <Avatar name={g.display_name} photoUrl={g.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gold-light text-base">{g.display_name}</div>
                  <div className="mt-1 text-white text-lg leading-snug text-balance">{g.message}</div>
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

      {/* QR sidebar — keep the join code visible during the greetings phase */}
      <aside className="col-span-4 flex flex-col items-center justify-center gap-4">
        <div className="chip">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span className="tracking-[0.3em]">עדיין אפשר להצטרף</span>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[28px] bg-gold-gradient opacity-25 blur-2xl" />
          <div className="relative rounded-[24px] bg-white p-4 shadow-gold-glow">
            <QRCodeSVG
              value={joinUrl}
              size={260}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#050506"
              includeMargin={false}
            />
          </div>
        </motion.div>
        <div className="text-center space-y-1">
          <div className="text-xs text-muted">קוד אירוע</div>
          <div className="text-3xl font-display font-black tracking-[0.4em] text-gold">
            {eventCode}
          </div>
        </div>
        <div className="text-center text-base text-muted max-w-xs">
          סרקו · שלחו ברכה · הצטרפו למשחקים
        </div>
      </aside>
    </div>
  );
}
