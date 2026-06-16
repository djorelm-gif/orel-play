'use client';

import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import type { Player } from '@/types/player';

interface TickerProps {
  players: Player[];
  // Optional title shown before the names start scrolling.
  title?: string;
}

// Premium scrolling "live ticker" that runs along the bottom of a hero
// screen — gold ribbon, RTL scroll, infinite duplicate-content loop so
// there's no visible jump when the list wraps around.
//
// Used on JoinScreen to replace the static chip row. The ribbon reads as
// "broadcast graphic" rather than "list of names".
export function NameTicker({ players, title = '🔴 שידור חי' }: TickerProps) {
  if (players.length === 0) return null;
  // Duplicate the list so the marquee can scroll one full width and seam
  // perfectly with itself.
  const loop = [...players, ...players];

  return (
    <div className="relative w-full overflow-hidden h-16" dir="rtl">
      {/* Gold ribbon background — top + bottom dark edges sell the embossed
          metal feel; the centre band is rich gold. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 88%, rgba(0,0,0,0.55) 100%), linear-gradient(90deg, #9c7732 0%, #d8a84e 20%, #ffe7a3 50%, #d8a84e 80%, #9c7732 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.6), 0 6px 24px rgba(0,0,0,0.45)',
        }}
      />

      {/* Title chip on the right (RTL leading edge) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 end-4 z-10 px-3 py-1 rounded-full font-display font-black tracking-[0.25em]"
        style={{
          background: 'rgba(5,5,6,0.85)',
          color: '#FFE7A3',
          fontSize: 14,
          border: '1px solid rgba(255,231,163,0.45)',
          boxShadow: '0 0 18px rgba(216,168,78,0.4)',
        }}
      >
        {title}
      </div>

      {/* Scrolling content — duplicated names so the loop seamlessly wraps */}
      <motion.div
        className="absolute inset-0 flex items-center gap-6 px-6 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: Math.max(20, players.length * 4), ease: 'linear', repeat: Infinity }}
      >
        {loop.map((p, i) => (
          <div key={`${p.id}-${i}`} className="flex items-center gap-2 shrink-0">
            <Avatar name={p.display_name} photoUrl={p.photo_url} size="sm" />
            <span
              className="font-display font-black text-black"
              style={{
                fontSize: 22,
                textShadow: '0 1px 0 rgba(255,255,255,0.45)',
              }}
            >
              {p.display_name}
            </span>
            <span className="text-black/40 font-black px-2">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
