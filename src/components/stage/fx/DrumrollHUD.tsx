'use client';

import { motion } from 'framer-motion';

interface DrumrollProps {
  // Big serif label on top, e.g. "הגלגל מסתובב..." or "תשובה תיחשף בעוד".
  label?: string;
  // Optional countdown integer. Leave undefined for a pure mood HUD.
  seconds?: number;
}

// Dramatic countdown / drumroll heads-up display. Sits over the wheel during
// WHEEL_SPINNING so the screen isn't static: a slow pulse, a huge ticking
// counter (when provided), and a hairline gold separator with the action label.
// Designed to occupy the LOWER 35% of the stage so it doesn't fight the wheel.
export function DrumrollHUD({ label = 'הגלגל מסתובב', seconds }: DrumrollProps) {
  const hasCount = typeof seconds === 'number';
  const danger = hasCount && (seconds ?? 0) <= 3;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none flex flex-col items-center pb-10 gap-3">
      {/* Pulsing dot + label */}
      <motion.div
        className="flex items-center gap-3"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="size-3 rounded-full"
          style={{
            background: danger ? 'rgb(var(--accent-rgb))' : '#FFE7A3',
            boxShadow: danger
              ? '0 0 18px rgb(var(--accent-rgb) / 0.9)'
              : '0 0 18px rgba(255,231,163,0.9)',
          }}
        />
        <span
          className="font-display font-black tracking-[0.32em]"
          style={{
            fontSize: 'clamp(14px, 1.3vw, 22px)',
            color: '#FFE7A3',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {label}
        </span>
      </motion.div>

      {/* Hairline gold separator */}
      <div
        className="w-72"
        style={{
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(255,231,163,0.7), transparent)',
        }}
      />

      {hasCount && (
        <motion.div
          key={seconds}
          initial={{ scale: 1.18, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="font-display font-black leading-none"
          style={{
            fontSize: 'clamp(80px, 11vw, 200px)',
            color: danger ? 'rgb(var(--accent-rgb))' : '#FFF7DC',
            WebkitTextStroke: '2px rgba(0,0,0,0.85)',
            textShadow: danger
              ? '0 6px 24px rgb(var(--accent-rgb) / 0.6), 0 0 60px rgb(var(--accent-rgb) / 0.4)'
              : '0 6px 24px rgba(0,0,0,0.7), 0 0 60px rgba(216,168,78,0.4)',
            letterSpacing: '-0.04em',
          }}
        >
          {seconds}
        </motion.div>
      )}
    </div>
  );
}
