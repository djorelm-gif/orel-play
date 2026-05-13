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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display font-black leading-[1.05] text-balance"
        style={{ fontSize: 'clamp(40px, 5.6vw, 88px)' }}
      >
        {question}
      </motion.h2>
    </div>
  );
}
