'use client';

import { motion } from 'framer-motion';

// Cinematic backdrop — rotating beams, vignette, sparkle dots. Pure CSS/SVG so it's lightweight.
export function StageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 stage-vignette" />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[140vmin] -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-screen"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(216,45,255,0.35) 20deg, transparent 40deg, transparent 180deg, rgba(216,168,78,0.35) 200deg, transparent 220deg, transparent 360deg)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background:
            'radial-gradient(circle at 25% 30%, #ffffff 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #ffffff 1px, transparent 1.5px), radial-gradient(circle at 50% 80%, #ffffff 1px, transparent 1.5px)',
          backgroundSize: '320px 320px, 240px 240px, 400px 400px',
        }}
      />
    </div>
  );
}
