'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import type { EventGame } from '@/types/game';

interface WheelProps {
  games: EventGame[];
  selectedGameId: string | null;
  isSpinning: boolean;
  onSpinComplete?: () => void;
  size?: number;
}

// Premium TV game-show wheel — flat polished disc, dark name-plates per segment
// for clean legibility on top of the rotating accent colours, and a long
// single-stage ease-out spin that lands on the peg without overshoot.
export function Wheel({ games, selectedGameId, isSpinning, onSpinComplete, size = 720 }: WheelProps) {
  const controls = useAnimation();
  const rotationRef = useRef(0);
  const [, force] = useState(0);

  const segments = useMemo(() => {
    const filtered = games.filter((g) => g.is_enabled);
    return filtered.length > 0 ? filtered : games;
  }, [games]);

  const segCount = Math.max(segments.length, 1);
  const segAngle = 360 / segCount;

  const conic = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i < segCount; i++) {
      const from = i * segAngle;
      const to = (i + 1) * segAngle;
      const layer =
        i % 2 === 0
          ? 'rgb(var(--accent-2-rgb) / 0.7)'
          : 'rgb(var(--accent-rgb) / 0.58)';
      stops.push(`${layer} ${from}deg ${to}deg`);
    }
    return `conic-gradient(from -90deg, ${stops.join(', ')}), #1a0f2b`;
  }, [segCount, segAngle]);

  useEffect(() => {
    if (!isSpinning) return;
    if (!selectedGameId) {
      // Pre-selection: build anticipation while the server picks. Long, slow,
      // graceful — no jitter.
      controls.start({
        rotate: rotationRef.current + 360 * 5,
        transition: { duration: 3, ease: [0.16, 1, 0.3, 1] },
      });
      return;
    }
    const idx = segments.findIndex((g) => g.id === selectedGameId);
    if (idx < 0) return;
    const segCenter = idx * segAngle + segAngle / 2;
    // Many turns + offset so the chosen segment lines up with the pointer.
    // Single ease-out (no overshoot, no settle wobble) reads as a heavy
    // polished disc decelerating to a clean stop. More elegant than a stamp.
    const turns = 8;
    const target = rotationRef.current + turns * 360 + (360 - segCenter) - (rotationRef.current % 360);
    rotationRef.current = target;
    controls
      .start({
        rotate: target,
        transition: { duration: 7.5, ease: [0.12, 0.85, 0.2, 1] },
      })
      .then(() => onSpinComplete?.());
    force((x) => x + 1);
  }, [isSpinning, selectedGameId, segments, segAngle, controls, onSpinComplete]);

  // Each label sits on a dark "name-plate" pill anchored at the segment's
  // centre angle. Plate dimensions scale with wheel size so the type stays
  // legible on any display.
  const plateRadius = size * 0.34; // distance from wheel centre to plate centre
  const plateW = size * 0.34;
  const plateH = size * 0.10;
  const fontPx = Math.max(22, Math.round(size * 0.058));

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Outer glow ring — slow accent halo */}
      <div
        className="absolute -inset-10 rounded-full opacity-70 blur-2xl pointer-events-none"
        aria-hidden
        style={{
          background:
            'conic-gradient(from 0deg, rgba(216,168,78,0.55), rgb(var(--accent-rgb) / 0.5), rgb(var(--accent-2-rgb) / 0.5), rgba(216,168,78,0.55))',
        }}
      />

      {/* Oval ground shadow — sells the disc sitting on a stage floor */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: size * 0.95,
          height: size * 0.22,
          bottom: -size * 0.1,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.42) 35%, transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Pointer — gold spear with cabochon dot underneath */}
      <div className="absolute left-1/2 -top-4 z-30 -translate-x-1/2">
        <div
          className="size-0 border-x-[24px] border-x-transparent border-b-[40px]"
          style={{
            borderBottomColor: '#FFE7A3',
            filter: 'drop-shadow(0 8px 18px rgba(216,168,78,0.85))',
          }}
        />
        <div className="absolute left-1/2 top-10 -translate-x-1/2 size-5 rounded-full bg-gold shadow-gold-glow" />
      </div>

      {/* Rim — luxury watch bezel: dark outer + gold band */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, transparent 64%, rgba(0,0,0,0.55) 66%, rgba(0,0,0,0.6) 70%, rgba(216,168,78,0.42) 73%, rgba(255,231,163,0.55) 76%, rgba(216,168,78,0.3) 78%, transparent 80%)',
          boxShadow:
            'inset 0 -12px 28px rgba(0,0,0,0.55), inset 0 14px 28px rgba(255,231,163,0.2), 0 30px 80px rgba(0,0,0,0.55)',
        }}
      />

      {/* The spinning disc */}
      <motion.div
        animate={controls}
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: conic,
          willChange: 'transform',
          border: '10px solid #d8a84e',
          boxShadow:
            '0 0 70px rgba(216,168,78,0.55), 0 28px 70px rgba(0,0,0,0.6), inset 0 0 50px rgba(0,0,0,0.65), inset 0 14px 36px rgba(255,231,163,0.22), inset 0 -18px 44px rgba(0,0,0,0.5)',
        }}
      >
        {/* Spokes — thin gold dividers between segments */}
        {segments.map((_, i) => (
          <div
            key={`spoke-${i}`}
            className="absolute left-1/2 top-1/2 origin-bottom h-1/2 w-px"
            style={{
              transform: `translateX(-50%) rotate(${i * segAngle}deg)`,
              background:
                'linear-gradient(to top, rgba(255,231,163,0.05), rgba(255,231,163,0.55) 60%, rgba(255,231,163,0.85))',
              boxShadow: '0 0 6px rgba(255,231,163,0.45)',
            }}
          />
        ))}

        {/* Name-plates — dark brass pills hold the label so it never has to
            fight the rotating accent colour underneath. Sits tangent to the
            wheel's circumference so when its segment is at the top of the
            disc the text reads naturally upright. */}
        {segments.map((g, i) => {
          const center = i * segAngle + segAngle / 2;
          return (
            <div
              key={g.id}
              className="absolute left-1/2 top-1/2 pointer-events-none"
              dir="rtl"
              style={{
                transformOrigin: '0 0',
                // Rotate the box to the segment angle, then move outward
                // along that direction. The box's own X axis (after rotate)
                // points along the radius, so a centred label reads radially.
                transform: `rotate(${center}deg) translate(-${plateW / 2}px, -${plateRadius + plateH / 2}px)`,
                width: plateW,
                height: plateH,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Dark brass pill with a soft gold rim, inner top highlight
                // and bottom shadow — reads as a metal plaque even on a flat
                // disc, in any accent colour.
                borderRadius: 9999,
                background:
                  'linear-gradient(180deg, rgba(28,16,8,0.96) 0%, rgba(12,6,2,0.96) 100%)',
                border: '1px solid rgba(255,231,163,0.55)',
                boxShadow:
                  '0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,231,163,0.35), inset 0 -2px 6px rgba(0,0,0,0.55)',
                paddingLeft: 14,
                paddingRight: 14,
              }}
            >
              <span
                className="font-display font-black whitespace-nowrap"
                style={{
                  fontSize: fontPx,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  // Solid gold-shimmer text on the dark plaque — high contrast,
                  // luxury feel, no need for outline. The plate handles the
                  // legibility, the gold gradient handles the prestige.
                  background:
                    'linear-gradient(180deg, #fff7dc 0%, #ffe7a3 40%, #d8a84e 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                  filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.6))',
                }}
              >
                {g.title}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* Static studio top-light — sits above the spinning disc so the light
          source stays put as the wheel rotates. Photo-real cheat that sells
          the depth without the tilt. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 38%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Hub — polished gold cabochon with the brand mark inside */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div
            className="rounded-full flex items-center justify-center p-4"
            style={{
              width: size * 0.24,
              height: size * 0.24,
              background:
                'radial-gradient(circle at 35% 25%, #fff7dc 0%, #ffe7a3 18%, #d8a84e 55%, #9c7732 100%)',
              boxShadow:
                '0 0 0 1px rgba(255,231,163,0.65), 0 10px 28px rgba(0,0,0,0.65), 0 20px 56px rgba(216,168,78,0.5), inset 0 3px 5px rgba(255,255,255,0.9), inset 0 -10px 18px rgba(120,75,20,0.65)',
            }}
          >
            <Logo size="md" className="brightness-0" />
          </div>
          <div className="absolute inset-0 rounded-full ring-4 ring-white/30" />
        </div>
      </div>
    </div>
  );
}
