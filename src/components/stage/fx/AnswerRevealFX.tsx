'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface RevealFXProps {
  // When true (e.g. liveSession.stage_state === 'GAME_RESULTS'), play the
  // TA-DA sequence: light burst from centre, gold confetti-line streaks
  // radiating outward, and a "stamp" pulse that reads as "ANSWER!".
  active: boolean;
  // Optional label drawn in massive gold serif during the burst, e.g. the
  // correct option text. Keep it short — 1-3 words.
  label?: string;
}

// Cinematic answer-reveal overlay. Sits z-30 above the stage content for ~1.2
// seconds, dramatising the moment the correct answer appears. Combines:
//   • full-screen radial light burst (camera flash)
//   • 12 short gold rays sweeping outward like festival fireworks
//   • a centred label that springs in with a stamp/zoom, then settles
//
// Pure decorative — does not capture pointer events, can be added/removed
// freely without touching surrounding markup.
export function AnswerRevealFX({ active, label }: RevealFXProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="reveal"
          className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
        >
          {/* Flash — full-screen radial bloom */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(255,247,210,0.9) 0%, rgba(255,231,163,0.45) 25%, rgba(216,168,78,0.18) 45%, transparent 70%)',
              mixBlendMode: 'screen',
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.05, 1.18] }}
            transition={{ duration: 0.85, times: [0, 0.35, 1], ease: 'easeOut' }}
          />

          {/* Gold rays radiating outward from centre. Twelve streaks evenly
              spaced; each one is a long thin rotated rectangle that scales
              from the centre, so it reads as a sparkler. */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            return (
              <motion.div
                key={`ray-${i}`}
                className="absolute left-1/2 top-1/2 origin-left"
                style={{
                  width: '60vmin',
                  height: 4,
                  marginTop: -2,
                  background:
                    'linear-gradient(to right, rgba(255,247,210,0.95) 0%, rgba(216,168,78,0.6) 40%, transparent 80%)',
                  transform: `rotate(${angle}deg)`,
                  filter: 'blur(0.5px)',
                  mixBlendMode: 'screen',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.95,
                  delay: 0.05 + (i % 4) * 0.04,
                  times: [0, 0.45, 1],
                  ease: 'easeOut',
                }}
              />
            );
          })}

          {/* Stamp label — huge gold serif that pops into the middle */}
          {label && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 1.35, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: [1.35, 0.95, 1], opacity: [0, 1, 1], filter: ['blur(8px)', 'blur(0px)', 'blur(0px)'] }}
              transition={{
                duration: 0.85,
                times: [0, 0.55, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="font-editorial font-black gold-shimmer leading-none text-center"
                style={{
                  fontSize: 'clamp(80px, 14vw, 240px)',
                  letterSpacing: '-0.03em',
                  textShadow: '0 12px 40px rgba(0,0,0,0.85)',
                  padding: '0 6vw',
                }}
              >
                {label}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
