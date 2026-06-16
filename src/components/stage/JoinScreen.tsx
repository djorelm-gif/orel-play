'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import type { OrelEvent } from '@/types/event';
import type { Player } from '@/types/player';
import { Logo } from '@/components/ui/Logo';
import { NameTicker } from './fx/NameTicker';

interface JoinScreenProps {
  event: OrelEvent;
  players: Player[];
  joinUrl: string;
}

export function JoinScreen({ event, players, joinUrl }: JoinScreenProps) {
  return (
    <div className="relative z-10 grid h-full grid-cols-12 gap-12 px-12 py-10 pb-24">
      <div className="col-span-7 flex flex-col justify-center gap-8">
        <div className="space-y-5">
          <Logo size="md" className="h-12" />
          <div className="space-y-2">
            <div className="chip">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="tracking-[0.3em]">שידור חי</span>
            </div>
            <h1 className="stage-headline-editorial font-editorial gold-shimmer">
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
      </div>

      <div className="col-span-5 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          {/* Halo + rotating gold arc — same luxury treatment as the greetings hero. */}
          <div className="absolute -inset-6 rounded-[40px] bg-gold-gradient opacity-30 blur-2xl" />
          <div className="absolute -inset-14 rounded-full ring-rotate-slow pointer-events-none">
            <div
              className="absolute inset-0 rounded-full opacity-70"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(255,231,163,0.7) 0deg, transparent 60deg, transparent 180deg, rgba(216,168,78,0.55) 240deg, transparent 300deg)',
                WebkitMask:
                  'radial-gradient(circle, transparent 60%, #000 61%, #000 64%, transparent 65%)',
                mask: 'radial-gradient(circle, transparent 60%, #000 61%, #000 64%, transparent 65%)',
              }}
            />
          </div>
          <div className="relative rounded-[36px] bg-white p-6 shadow-gold-glow overflow-hidden">
            <QRCodeSVG
              value={joinUrl}
              size={420}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#050506"
              includeMargin={false}
            />
            <div
              className="pointer-events-none absolute inset-0 qr-sheen-loop"
              style={{
                background:
                  'linear-gradient(105deg, transparent 35%, rgba(255,231,163,0.55) 50%, transparent 65%)',
              }}
              aria-hidden
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

      {/* Live ticker — gold ribbon along the bottom with all joined guests
          marqueeing in a seamless RTL loop. Replaces the static "names so
          far" chip row that used to sit in the left column. */}
      {players.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <NameTicker players={players} />
        </div>
      )}
    </div>
  );
}
