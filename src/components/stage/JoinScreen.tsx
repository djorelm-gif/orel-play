'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrelEvent } from '@/types/event';
import type { Player } from '@/types/player';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';

interface JoinScreenProps {
  event: OrelEvent;
  players: Player[];
  joinUrl: string;
}

export function JoinScreen({ event, players, joinUrl }: JoinScreenProps) {
  const recent = players.slice(-8).reverse();
  return (
    <div className="relative z-10 grid h-full grid-cols-12 gap-12 px-12 py-10">
      <div className="col-span-7 flex flex-col justify-center gap-8">
        <div className="space-y-5">
          <Logo size="md" className="h-12" />
          <div className="space-y-2">
            <div className="chip">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="tracking-[0.3em]">שידור חי</span>
            </div>
            <h1 className="stage-headline font-display gold-shimmer">
              מצטרפים למשחק
              <br />
              של {event.child_name}
            </h1>
            <p className="stage-subheadline text-muted">סרקו את הקוד והיכנסו למשחק</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="panel-strong px-6 py-4">
            <div className="text-xs text-muted">קוד אירוע</div>
            <div className="text-4xl font-display font-black tracking-[0.4em] text-gold">
              {event.event_code}
            </div>
          </div>
          <div className="panel-strong px-6 py-4">
            <div className="text-xs text-muted">מצטרפים</div>
            <div className="text-4xl font-display font-black text-gold-light">{players.length}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>שמות שהצטרפו עכשיו:</span>
          <AnimatePresence mode="popLayout">
            {recent.length === 0 && <span className="text-muted/70">עוד אין... תהיו הראשונים</span>}
            {recent.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className="flex items-center gap-2 rounded-full bg-white/8 ps-1.5 pe-3 py-1 border border-white/10"
              >
                <Avatar name={p.display_name} photoUrl={p.photo_url} size="sm" />
                <span className="text-white font-semibold">{p.display_name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="col-span-5 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[40px] bg-gold-gradient opacity-30 blur-2xl" />
          <div className="relative rounded-[36px] bg-white p-6 shadow-gold-glow">
            <QRCodeSVG
              value={joinUrl}
              size={420}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#050506"
              includeMargin={false}
            />
          </div>
          <div className="mt-4 text-center text-sm text-muted">
            או היכנסו ל-
            <span className="text-gold-light font-semibold">
              {joinUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
