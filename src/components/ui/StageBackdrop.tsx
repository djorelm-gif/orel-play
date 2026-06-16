'use client';

import { motion } from 'framer-motion';

// Cinematic luxury backdrop:
//   1. Base vignette in the theme accent — anchors the scene.
//   2. A slowly breathing radial "halo" behind the centre — like a stage spot
//      warming up; sells the idea of depth and a focal point.
//   3. A slow-rotating conic sweep at very low opacity — adds drama without
//      ever drawing attention to itself.
//   4. A drifting gold-dust layer made from radial-gradient sparkles — the
//      "luxury particle" feel. Pure CSS background-image, GPU-only animation.
//   5. A stationary star-field at very low opacity — depth perception.
// All effects respect prefers-reduced-motion via the global rule in
// globals.css that clamps animation-duration.
export function StageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 1. Theme-aware vignette */}
      <div className="absolute inset-0 stage-vignette" />

      {/* 2. Breathing accent halo — sits behind everything, gently pulses. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[110vmin] -translate-x-1/2 -translate-y-1/2 halo-breathe"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--accent-rgb) / 0.22) 0%, rgb(var(--accent-2-rgb) / 0.08) 35%, transparent 65%)',
          filter: 'blur(20px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 3. Rotating accent + gold conic sweep — at 18% opacity so it's
         atmospheric, not theatrical. */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[160vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.18] mix-blend-screen"
        animate={{ rotate: 360 }}
        transition={{ duration: 42, ease: 'linear', repeat: Infinity }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgb(var(--accent-rgb) / 0.42) 18deg, transparent 38deg, transparent 170deg, rgba(216,168,78,0.48) 195deg, transparent 220deg, transparent 360deg)',
        }}
      />

      {/* 4. Slow-drifting gold dust — multiple sparkle sizes layered for
         parallax-on-still feel. Drifts diagonally over 36s. */}
      <div
        aria-hidden
        className="absolute -inset-[20%] gold-dust-drift opacity-[0.14] mix-blend-screen"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 12% 18%, rgba(255,231,163,0.85) 0.5px, transparent 1.6px)',
            'radial-gradient(circle at 78% 42%, rgba(255,247,220,0.8) 0.5px, transparent 1.4px)',
            'radial-gradient(circle at 38% 78%, rgba(216,168,78,0.7) 0.5px, transparent 1.5px)',
            'radial-gradient(circle at 88% 88%, rgba(255,231,163,0.7) 0.4px, transparent 1.2px)',
            'radial-gradient(circle at 56% 28%, rgba(255,247,220,0.65) 0.4px, transparent 1.2px)',
          ].join(', '),
          backgroundSize: '380px 380px, 280px 280px, 460px 460px, 220px 220px, 340px 340px',
        }}
      />

      {/* 5. Stationary white star-field — same as before but lighter so the
         drifting dust above can carry the motion. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background:
            'radial-gradient(circle at 25% 30%, #ffffff 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #ffffff 1px, transparent 1.5px), radial-gradient(circle at 50% 80%, #ffffff 1px, transparent 1.5px)',
          backgroundSize: '320px 320px, 240px 240px, 400px 400px',
        }}
      />
    </div>
  );
}
