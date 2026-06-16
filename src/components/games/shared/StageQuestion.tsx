'use client';

import { motion } from 'framer-motion';

export function StageQuestion({ kicker, question }: { kicker?: string; question: string }) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
