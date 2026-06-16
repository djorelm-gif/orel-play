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

// Premium game-show wheel with 3D perspective, layered lighting, radial labels
// that run from rim to hub (like a real TV-show wheel), and a long ease-out
// spin that finishes with a tiny bounce on landing.
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

  // Conic gradient — alternating accent shades themed via CSS vars so the
  // wheel adapts to bat/bar mitzvah colorways automatically.
  const conic = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i < segCount; i++) {
      const from = i * segAngle;
      const to = (i + 1) * segAngle;
      const layer =
        i % 2 === 0
          ? 'rgb(var(--accent-2-rgb) / 0.62)'
          : 'rgb(var(--accent-rgb) / 0.5)';
      stops.push(`${layer} ${from}deg ${to}deg`);
    }
    return `conic-gradient(from -90deg, ${stops.join(', ')}), #1a0f2b`;
  }, [segCount, segAngle]);

  useEffect(() => {
    if (!isSpinning) return;
    if (!selectedGameId) {
      // Idle pre-selection spin: build anticipation while server picks.
      controls.start({
        rotate: rotationRef.current + 360 * 6,
        transition: { duration: 3.5, ease: [0.16, 1, 0.3, 1] },
      });
      return;
    }
    const idx = segments.findIndex((g) => g.id === selectedGameId);
    if (idx < 0) return;
    const segCenter = idx * segAngle + segAngle / 2;
    const turns = 7;
    const finalAngle = turns * 360 + (360 - segCenter);
    const target = rotationRef.current + finalAngle - (rotationRef.current % 360);

    rotationRef.current = target;

    // Two-stage stop: a long slowdown into the landing, then a tiny overshoot
    // + settle so it feels like a real heavy wheel ratcheting onto the peg.
    controls
      .start({
        rotate: [rotationRef.current, target + 4, target - 1.5, target],
        transition: {
          duration: 6.2,
          times: [0, 0.85, 0.94, 1],
          ease: [0.18, 0.92, 0.28, 1],
        },
      })
      .then(() => onSpinComplete?.());
    force((x) => x + 1);
  }, [isSpinning, selectedGameId, segments, segAngle, controls, onSpinComplete]);

  // Radial label: the text container is anchored at the wheel centre, then
  // rotated so its long axis points outward along the segment. Hebrew RTL
  // means the first letter naturally sits at the rim end — exactly the
  // direction the audience reads on a real game-show wheel.
  const labelLength = size * 0.30; // distance text covers along the radius
  const labelOffset = size * 0.16; // gap between hub and start of text

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        // The whole wheel sits in 3D perspective so a small rotateX tilt reads
        // as real depth (camera looking slightly down).
        perspective: `${size * 2.4}px`,
        perspectiveOrigin: '50% 40%',
      }}
    >
      {/* Outer glow ring — slow conic sweep tied into the active accent palette */}
      <div
        className="absolute -inset-10 rounded-full opacity-70 blur-2xl pointer-events-none"
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

      {/* TILT WRAPPER — every layered element inside gets the same 3D tilt so
          shadows, gradients, and rim stay in registration when the wheel spins. */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotateX(14deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Rim — luxury watch bezel: dark outer + gold band + inner shadow */}
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
            transformStyle: 'preserve-3d',
            boxShadow:
              '0 0 70px rgba(216,168,78,0.55), 0 28px 70px rgba(0,0,0,0.6), inset 0 0 50px rgba(0,0,0,0.65), inset 0 14px 36px rgba(255,231,163,0.22), inset 0 -18px 44px rgba(0,0,0,0.5)',
          }}
        >
          {/* Per-segment subtle darker wedge to add depth — sits under the labels */}
          {segments.map((_, i) => {
            const from = i * segAngle;
            const to = (i + 1) * segAngle;
            return (
              <div
                key={`wedge-${i}`}
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `conic-gradient(from -90deg, transparent ${from}deg, rgba(0,0,0,${
                    i % 2 === 0 ? 0.12 : 0
                  }) ${from}deg ${to}deg, transparent ${to}deg)`,
                }}
              />
            );
          })}

          {/* Spokes — thin gold dividers between segments */}
          {segments.map((_, i) => (
            <div
              key={`spoke-${i}`}
              className="absolute left-1/2 top-1/2 origin-bottom h-1/2 w-px"
              style={{
                transform: `translateX(-50%) rotate(${i * segAngle}deg)`,
                background:
                  'linear-gradient(to top, rgba(255,231,163,0.05), rgba(255,231,163,0.6) 60%, rgba(255,231,163,0.9))',
                boxShadow: '0 0 6px rgba(255,231,163,0.5)',
              }}
            />
          ))}

          {/* Radial labels — text reads from rim toward hub along each segment */}
          {segments.map((g, i) => {
            const center = i * segAngle + segAngle / 2;
            // Each label sits in a rotated box whose +X axis points outward
            // along the segment, anchored at the wheel centre. The text is
            // pushed against the outer edge (textAlign: right with dir rtl
            // = first letter at the rim) and limited to one line.
            const fontPx = Math.max(20, Math.round(size * 0.052));
            return (
              <div
                key={g.id}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                dir="rtl"
                style={{
                  // Pivot is at the wheel centre; rotate so the label runs
                  // along the radial axis.
                  transformOrigin: '0 0',
                  transform: `rotate(${center - 90}deg) translate(${labelOffset}px, -${
                    fontPx * 0.7
                  }px)`,
                  width: labelLength,
                  height: fontPx * 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingInlineEnd: 18,
                  textShadow:
                    '0 2px 8px rgba(0,0,0,0.85), 0 0 14px rgba(255,231,163,0.35)',
                }}
              >
                <span
                  className="font-display font-black whitespace-nowrap"
                  style={{
                    fontSize: fontPx,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                    // Subtle gold gradient on the text — adds richness without
                    // hurting legibility, since we keep a deep shadow underneath.
                    background:
                      'linear-gradient(180deg, #fff9e5 0%, #ffe7a3 45%, #d8a84e 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    // Outline-style stroke for legibility against the segment color
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.4)',
                  }}
                >
                  {g.title}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Studio top-light — a static soft highlight that lives ABOVE the
            spinning disc, so as the wheel turns the light source stays put
            (it's a photo-realistic cheat that sells the 3D illusion). */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 38%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Hub — polished gold cabochon */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className="rounded-full flex items-center justify-center p-4"
              style={{
                width: size * 0.22,
                height: size * 0.22,
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
    </div>
  );
}
