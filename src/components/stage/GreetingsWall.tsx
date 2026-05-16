'use client';

import { useEffect, useMemo, useState } from 'react';
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

const MAX_BUBBLES = 8;

// Anchor points across the canvas. Each new bubble grabs the next index in
// order, so the most recent message lands first / centre and pushes older
// ones outward, but the layout still feels organically scattered (gaps + odd
// angles, not a grid).
const SPOTS: { left: string; top: string; rotate: number }[] = [
  { left: '50%', top: '45%', rotate: -2 },   // most prominent — newest goes here
  { left: '26%', top: '58%', rotate: 1.5 },
  { left: '72%', top: '40%', rotate: -1 },
  { left: '38%', top: '76%', rotate: 2 },
  { left: '62%', top: '72%', rotate: -2 },
  { left: '20%', top: '36%', rotate: 1 },
  { left: '80%', top: '64%', rotate: -1.5 },
  { left: '45%', top: '28%', rotate: 1.8 },
];

function Bubble({
  g,
  spotIdx,
  kick,
  isNewest,
}: {
  g: Greeting;
  spotIdx: number;
  kick: number;
  isNewest: boolean;
}) {
  const spot = SPOTS[spotIdx % SPOTS.length];
  // Per-bubble drift so motion is gentle but distinct. Seed from id chars.
  const drift = useMemo(() => {
    const seed = (g.id.charCodeAt(0) + g.id.charCodeAt(g.id.length - 1) + spotIdx) % 100;
    return {
      x: [0, (seed % 24) - 12, ((seed * 3) % 30) - 15, 0],
      y: [0, ((seed * 5) % 20) - 10, ((seed * 7) % 24) - 12, 0],
      rotate: [spot.rotate, spot.rotate + 1.5, spot.rotate - 1.5, spot.rotate],
    };
  }, [g.id, spotIdx, spot.rotate]);

  return (
    <motion.div
      key={`${g.id}-${kick}`}
      layout
      className="absolute -translate-x-1/2 -translate-y-1/2 w-[min(34vw,520px)] flex items-start gap-4 rounded-3xl px-5 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-md border"
      style={{
        left: spot.left,
        top: spot.top,
        background: 'rgba(255, 255, 255, 0.10)',
        borderColor: 'rgba(255, 255, 255, 0.16)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isNewest ? [0, 1.08, 1] : 1,
        opacity: 1,
        x: drift.x,
        y: drift.y,
        rotate: drift.rotate,
      }}
      exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.35 } }}
      transition={{
        scale: isNewest
          ? { duration: 0.7, times: [0, 0.6, 1], ease: [0.16, 1, 0.3, 1] }
          : { type: 'spring', stiffness: 260, damping: 18 },
        opacity: { duration: 0.45 },
        x: { duration: 14 + ((spotIdx * 3) % 6), repeat: Infinity, ease: 'easeInOut' },
        y: { duration: 14 + ((spotIdx * 3) % 6), repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <Avatar name={g.display_name} photoUrl={g.photo_url} size="xl" className="ring-gold/60" />
      <div className="flex-1 min-w-0 pt-1">
        <div className="font-bold text-gold-light text-xl leading-tight">{g.display_name}</div>
        <div className="mt-1.5 text-white text-2xl leading-snug text-balance break-words">
          {g.message}
        </div>
      </div>
    </motion.div>
  );
}

export function GreetingsWall({ greetings, childName, joinUrl, eventCode }: Props) {
  // Newest first — feeds into the centre spot (index 0)
  const ordered = [...greetings]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, MAX_BUBBLES);

  // Track which bubble is the "current newest" so we can give it the heroic
  // pop animation exactly once when it arrives.
  const newestId = ordered[0]?.id;
  const [lastNewest, setLastNewest] = useState<string | null>(null);
  useEffect(() => {
    if (newestId && newestId !== lastNewest) {
      setLastNewest(newestId);
    }
  }, [newestId, lastNewest]);

  // Random "keep it alive" pops every few seconds — pick a non-newest bubble
  // and bump its kick counter so its scale animation re-runs.
  const [kicks, setKicks] = useState<Record<string, number>>({});
  useEffect(() => {
    if (ordered.length === 0) return;
    const id = setInterval(() => {
      const candidates = ordered.slice(1); // never re-pop the freshly-arrived hero
      if (candidates.length === 0) return;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      setKicks((m) => ({ ...m, [pick.id]: (m[pick.id] ?? 0) + 1 }));
    }, 4200);
    return () => clearInterval(id);
  }, [ordered]);

  return (
    <div className="relative z-10 h-full overflow-hidden">
      {/* Top-right: child title */}
      <div className="absolute top-8 right-8 z-20 text-end">
        <h1
          className="font-display gold-shimmer leading-[0.95]"
          style={{ fontSize: 'clamp(48px, 6.4vw, 110px)' }}
        >
          ברכות ל{childName}
        </h1>
      </div>

      {/* Top-left: QR + event code (replaces the old description) */}
      <div className="absolute top-8 left-8 z-20">
        <div className="panel-strong p-4 flex items-center gap-4">
          <div className="rounded-2xl bg-white p-2 shadow-gold-glow">
            <QRCodeSVG
              value={joinUrl}
              size={140}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#050506"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted">קוד הצטרפות</div>
            <div className="text-3xl font-display font-black tracking-[0.35em] text-gold leading-none">
              {eventCode}
            </div>
            <div className="text-sm text-muted">סרקו ושלחו ברכה</div>
          </div>
        </div>
      </div>

      {/* Floating bubbles */}
      <AnimatePresence>
        {ordered.map((g, i) => (
          <Bubble
            key={g.id}
            g={g}
            spotIdx={i}
            kick={kicks[g.id] ?? 0}
            isNewest={g.id === newestId}
          />
        ))}
      </AnimatePresence>

      {ordered.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="panel-strong px-10 py-8 text-center text-2xl text-muted max-w-xl">
            עדיין לא הגיעו ברכות. סרקו את ה-QR ושלחו את הראשונה 💫
          </div>
        </div>
      )}
    </div>
  );
}
