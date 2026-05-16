'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { EventGame } from '@/types/game';

interface WheelProps {
  games: EventGame[];
  selectedGameId: string | null;
  isSpinning: boolean;
  onSpinComplete?: () => void;
  size?: number;
}

// Premium wheel: rounded glass disc, color-rotating segments, gold pointer + halo.
// Spin animates from current rotation → target landing on the selected segment, with overshoot.
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

  // Build a single conic gradient with alternating accent shades, themed via CSS vars
  const conic = useMemo(() => {
    // Mix dark backdrop with current accent at varying intensities so it adapts to bat/bar
    const stops: string[] = [];
    for (let i = 0; i < segCount; i++) {
      const from = i * segAngle;
      const to = (i + 1) * segAngle;
      // Alternate two depths of the active accent
      const layer = i % 2 === 0 ? 'rgb(var(--accent-2-rgb) / 0.55)' : 'rgb(var(--accent-rgb) / 0.45)';
      stops.push(`${layer} ${from}deg ${to}deg`);
    }
    return `conic-gradient(from -90deg, ${stops.join(', ')}), #1a0f2b`;
  }, [segCount, segAngle]);

  useEffect(() => {
    if (!isSpinning) return;
    if (!selectedGameId) {
      // Spin freely until selection arrives
      controls.start({
        rotate: rotationRef.current + 360 * 6,
        transition: { duration: 3.5, ease: [0.16, 1, 0.3, 1] },
      });
      return;
    }
    const idx = segments.findIndex((g) => g.id === selectedGameId);
    if (idx < 0) return;
    const segCenter = idx * segAngle + segAngle / 2;
    // Pointer is at top (-90deg from segment 0 start). We want segCenter to land at pointer = 0deg up.
    // Final rotation: many full turns + offset so the segCenter lines up with pointer.
    const turns = 6;
    const finalAngle = turns * 360 + (360 - segCenter);
    const target = rotationRef.current + finalAngle - (rotationRef.current % 360);

    rotationRef.current = target;
    controls
      .start({
        rotate: target,
        transition: { duration: 5.5, ease: [0.16, 1, 0.3, 1] },
      })
      .then(() => onSpinComplete?.());
    force((x) => x + 1);
  }, [isSpinning, selectedGameId, segments, segAngle, controls, onSpinComplete]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div
        className="absolute -inset-8 rounded-full opacity-70 blur-2xl"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(216,168,78,0.5), rgb(var(--accent-rgb) / 0.5), rgb(var(--accent-2-rgb) / 0.5), rgba(216,168,78,0.5))',
        }}
      />

      {/* Pointer */}
      <div className="absolute left-1/2 -top-3 z-20 -translate-x-1/2">
        <div
          className="size-0 border-x-[22px] border-x-transparent border-b-[36px]"
          style={{ borderBottomColor: '#FFE7A3', filter: 'drop-shadow(0 6px 16px rgba(216,168,78,0.8))' }}
        />
        <div className="absolute left-1/2 top-9 -translate-x-1/2 size-4 rounded-full bg-gold shadow-gold-glow" />
      </div>

      {/* Wheel disc */}
      <motion.div
        animate={controls}
        className="absolute inset-0 rounded-full border-[8px] border-gold/80 shadow-[0_0_60px_rgba(216,168,78,0.5),inset_0_0_40px_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ background: conic, willChange: 'transform' }}
      >
        {segments.map((g, i) => {
          const center = i * segAngle + segAngle / 2;
          return (
            <div
              key={g.id}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${center}deg) translateY(-${size * 0.32}px)`,
                width: 200,
                textAlign: 'center',
              }}
            >
              <div className="text-white font-display font-black text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {g.title}
              </div>
            </div>
          );
        })}

        {/* Spokes */}
        {segments.map((_, i) => (
          <div
            key={`spoke-${i}`}
            className="absolute left-1/2 top-1/2 origin-bottom h-1/2 w-px bg-white/15"
            style={{ transform: `translateX(-50%) rotate(${i * segAngle}deg)` }}
          />
        ))}
      </motion.div>

      {/* Hub */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="size-32 rounded-full bg-gold-gradient shadow-gold-glow flex items-center justify-center">
            <span className="font-display font-black text-3xl text-black tracking-widest">OREL</span>
          </div>
          <div className="absolute inset-0 rounded-full ring-4 ring-white/30" />
        </div>
      </div>
    </div>
  );
}
