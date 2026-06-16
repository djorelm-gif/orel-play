'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COUNTDOWN_SECONDS = 30;

interface Props {
  kicker?: string;
  question: string;
  // ISO timestamp captured when GAME_ACTIVE was entered. When provided the
  // stage shows a 30-second countdown ring in the top-end corner. Player UIs
  // pass nothing here so they get the original card.
  activatedAt?: string | null;
  // While true the countdown ticks. When the host flips to GAME_RESULTS we
  // pass false and the ring freezes at whatever it was showing.
  active?: boolean;
}

export function StageQuestion({ kicker, question, activatedAt, active }: Props) {
  return (
    <div className="relative space-y-4">
      {kicker && (
        <div className="chip">
          <span className="size-2 rounded-full bg-magenta animate-pulse" />
          <span className="tracking-[0.3em]">{kicker}</span>
        </div>
      )}
      <motion.h2
        key={question}
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="font-editorial font-black leading-[1.05] text-balance"
        style={{
          fontSize: 'clamp(40px, 5.6vw, 88px)',
          letterSpacing: '-0.02em',
          textShadow:
            '0 2px 0 rgba(0,0,0,0.4), 0 12px 28px rgba(0,0,0,0.5), 0 0 40px rgba(216,168,78,0.12)',
        }}
      >
        {question}
      </motion.h2>
      {activatedAt && active && <CountdownChip activatedAt={activatedAt} />}
    </div>
  );
}

// Visible 30→0 countdown anchored to the top-end (RTL: top-left) corner of
// the stage. Ring + huge gold serif number. Pulses magenta when ≤ 5 sec and
// clamps at 0 — we never auto-flip the state, the host stays in control.
function CountdownChip({ activatedAt }: { activatedAt: string }) {
  const [remaining, setRemaining] = useState(() => computeRemaining(activatedAt));

  useEffect(() => {
    setRemaining(computeRemaining(activatedAt));
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(activatedAt));
    }, 200);
    return () => window.clearInterval(id);
  }, [activatedAt]);

  const danger = remaining <= 5;
  const progress = Math.max(0, Math.min(1, remaining / COUNTDOWN_SECONDS));
  const size = 112;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);

  return (
    <div
      className="pointer-events-none fixed top-6 start-6 z-30"
      style={{ width: size, height: size }}
    >
      <div
        className={`relative w-full h-full grid place-items-center rounded-full ${
          danger ? 'animate-pulse' : ''
        }`}
        style={{
          background: 'rgba(5,5,6,0.55)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
          boxShadow: danger
            ? '0 0 28px rgb(var(--accent-rgb) / 0.6), inset 0 0 0 1px rgb(var(--accent-rgb) / 0.55)'
            : '0 6px 24px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,231,163,0.25)',
        }}
      >
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={danger ? 'rgb(var(--accent-rgb))' : '#FFE7A3'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }}
          />
        </svg>
        <span
          className="font-display font-black tabular-nums"
          style={{
            fontSize: 48,
            lineHeight: 1,
            color: danger ? 'rgb(var(--accent-rgb))' : '#FFE7A3',
            textShadow: danger
              ? '0 0 18px rgb(var(--accent-rgb) / 0.7)'
              : '0 2px 0 rgba(0,0,0,0.55), 0 0 18px rgba(255,231,163,0.4)',
          }}
        >
          {String(Math.max(0, remaining)).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function computeRemaining(activatedAt: string): number {
  const started = new Date(activatedAt).getTime();
  if (Number.isNaN(started)) return COUNTDOWN_SECONDS;
  const elapsed = (Date.now() - started) / 1000;
  return Math.max(0, Math.ceil(COUNTDOWN_SECONDS - elapsed));
}
