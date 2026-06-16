'use client';

import { motion } from 'framer-motion';

interface SpotlightProps {
  // 'wheel' = slow drifting beams + flares while the wheel builds tension.
  // 'reveal' = single hot burst when an answer is unveiled.
  // 'intro' = swooping pair of beams that cross the stage as we hand off from
  // the wheel into the game intro.
  mode?: 'wheel' | 'reveal' | 'intro';
  intensity?: number; // 0-1
}

// Cinematic stage lighting layer. Designed to sit absolutely-positioned over
// the main stage content (z-10) and behind the main hero so the lighting
// feels three-dimensional — like the audience is in a TV studio with two
// big follow-spots crossing overhead, lens flares blooming when the camera
// catches them, and atmospheric haze drifting in front of the lens.
export function SpotlightFX({ mode = 'wheel', intensity = 1 }: SpotlightProps) {
  const beams = mode === 'reveal' ? 1 : 2;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Atmospheric haze — fakes the smoke that primetime studios pump in so
          beams have something to scatter through. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(255,235,180,0.06) 0%, transparent 55%)',
          opacity: intensity,
        }}
      />

      {/* Follow-spots — long warm cones sweeping back and forth. The motion is
          intentionally slow and offset between the two so they never look
          synchronised (which reads as fake). */}
      {Array.from({ length: beams }).map((_, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute"
          style={{
            top: '-10%',
            left: i === 0 ? '15%' : '65%',
            width: '12%',
            height: '140%',
            transformOrigin: '50% 0%',
            background:
              'linear-gradient(to bottom, rgba(255,235,180,0.55) 0%, rgba(255,210,120,0.25) 35%, rgba(216,168,78,0.08) 70%, transparent 100%)',
            filter: 'blur(18px)',
            mixBlendMode: 'screen',
            opacity: intensity * 0.85,
          }}
          animate={
            mode === 'reveal'
              ? { rotate: [0, 0], scaleY: [0.4, 1.1, 1], opacity: [0, 0.85, 0] }
              : mode === 'intro'
                ? {
                    rotate: i === 0 ? [-18, 18] : [18, -18],
                    opacity: [0, 0.7, 0],
                  }
                : {
                    rotate: i === 0 ? [-12, 12, -12] : [12, -12, 12],
                  }
          }
          transition={
            mode === 'reveal'
              ? { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
              : mode === 'intro'
                ? { duration: 1.4, ease: [0.22, 1, 0.36, 1], times: [0, 0.6, 1] }
                : {
                    duration: 9 + i * 3,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'mirror' as const,
                  }
          }
        />
      ))}

      {/* Lens flares — bright concentric blooms that bloom briefly as if the
          camera caught a spotlight head-on. Random rhythm so they read as
          accidents, not animation loops. */}
      {mode === 'wheel' && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              top: '12%',
              right: '18%',
              width: 220,
              height: 220,
              background:
                'radial-gradient(circle, rgba(255,247,210,0.55) 0%, rgba(255,231,163,0.25) 35%, transparent 70%)',
              filter: 'blur(2px)',
              mixBlendMode: 'screen',
            }}
            animate={{ opacity: [0, 0.9, 0, 0], scale: [0.6, 1.1, 0.9, 0.6] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: '18%',
              left: '20%',
              width: 180,
              height: 180,
              background:
                'radial-gradient(circle, rgb(var(--accent-rgb) / 0.4) 0%, rgb(var(--accent-2-rgb) / 0.18) 40%, transparent 70%)',
              filter: 'blur(3px)',
              mixBlendMode: 'screen',
            }}
            animate={{ opacity: [0, 0.7, 0, 0], scale: [0.7, 1, 0.8, 0.7] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeOut',
              delay: 0.7,
            }}
          />
        </>
      )}

      {/* Reveal flash — single hot burst, used at the moment of TA-DA. */}
      {mode === 'reveal' && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(255,247,210,0.85) 0%, rgba(255,231,163,0.4) 25%, transparent 55%)',
            mixBlendMode: 'screen',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 1.2] }}
          transition={{ duration: 0.75, times: [0, 0.35, 1], ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
