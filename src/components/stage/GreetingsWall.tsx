'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Greeting } from '@/types/greeting';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';

interface Props {
  greetings: Greeting[];
  childName: string;
  joinUrl: string;
  eventCode: string;
}

const MAX_BUBBLES = 8;

// Bubble anchor points across the LOWER 65% of the canvas — the top is reserved
// for the hero (title + QR) so the title stays prominent like JoinScreen does.
const SPOTS: { left: string; top: string; rotate: number }[] = [
  { left: '50%', top: '62%', rotate: -2 },   // newest — front and centre
  { left: '24%', top: '70%', rotate: 1.5 },
  { left: '76%', top: '60%', rotate: -1 },
  { left: '38%', top: '86%', rotate: 2 },
  { left: '62%', top: '88%', rotate: -2 },
  { left: '16%', top: '52%', rotate: 1 },
  { left: '84%', top: '78%', rotate: -1.5 },
  { left: '50%', top: '46%', rotate: 1.8 },
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
      {/* Hero strip — mirrors the JoinScreen hero so the two stages share a
          consistent premium look: QR card with halo on the left, big gold-shimmer
          title + live chip + counter on the right. */}
      <div className="grid grid-cols-12 gap-12 px-12 py-10 items-center">
        {/* QR (col-5) — same halo + white panel as JoinScreen, slightly smaller
            to leave room for the bubble field below. */}
        <div className="col-span-5 flex justify-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="relative"
          >
            {/* Soft gold halo behind everything — the breathing studio light. */}
            <div className="absolute -inset-6 rounded-[40px] bg-gold-gradient opacity-30 blur-2xl" />
            {/* Slow-rotating dotted gold ring outside the QR — adds depth + motion
                without competing with the bubbles. Counter-clockwise so it
                doesn't sync with the inner content. */}
            <div className="absolute -inset-10 rounded-full ring-rotate-slow pointer-events-none">
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
            <div className="relative rounded-[32px] bg-white p-5 shadow-gold-glow overflow-hidden">
              <QRCodeSVG
                value={joinUrl}
                size={280}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#050506"
                includeMargin={false}
              />
              {/* Sheen sweep across the QR every 6s — like glass catching light. */}
              <div
                className="pointer-events-none absolute inset-0 qr-sheen-loop"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(255,231,163,0.55) 50%, transparent 65%)',
                }}
                aria-hidden
              />
            </div>
            <div className="mt-3 text-center text-sm text-muted">
              {joinUrl.replace(/^https?:\/\//, '')}
            </div>
          </motion.div>
        </div>

        {/* Title + counters (col-7) */}
        <div className="col-span-7 flex flex-col gap-5 text-end">
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-3">
              <div className="chip">
                <span className="size-2 rounded-full bg-magenta animate-pulse" />
                <span className="tracking-[0.3em]">ברכות חיות</span>
              </div>
              <Logo size="md" className="h-12" />
            </div>
            <h1 className="stage-headline-editorial font-editorial gold-shimmer leading-[0.95]">
              ברכות ל{childName}
            </h1>
            <p className="stage-subheadline text-muted">
              סרקו את ה-QR ושלחו ברכה — תופיע כאן בזמן אמת
            </p>
          </div>
          <div className="flex items-center gap-4 justify-end">
            <div className="panel-strong px-5 py-3 flex items-center gap-3">
              <div className="text-xs text-muted">ברכות שעלו</div>
              <div className="text-3xl font-display font-black text-gold-light leading-none">
                {greetings.length}
              </div>
            </div>
            <div className="panel-strong px-5 py-3 flex items-center gap-3">
              <div className="text-xs text-muted">קוד</div>
              <div className="text-3xl font-display font-black tracking-[0.35em] text-gold leading-none">
                {eventCode}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating bubbles — anchored to the lower portion of the canvas */}
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
        <div className="absolute inset-x-0 bottom-[15%] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="panel-strong px-10 py-6 text-center text-2xl text-muted max-w-xl"
          >
            עדיין לא הגיעו ברכות. סרקו את ה-QR ושלחו את הראשונה 💫
          </motion.div>
        </div>
      )}
    </div>
  );
}
