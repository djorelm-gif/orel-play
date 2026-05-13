'use client';

import { motion } from 'framer-motion';

export function AnswerTally({
  options,
  counts,
  correctId,
  reveal,
}: {
  options: Array<{ id: string; label: string }>;
  counts: Record<string, number>;
  correctId?: string | null;
  reveal?: boolean;
}) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const c = counts[opt.id] ?? 0;
        const pct = Math.round((c / max) * 100);
        const isCorrect = reveal && opt.id === correctId;
        return (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="w-1/3 truncate text-end text-lg">{opt.label}</div>
            <div className="relative flex-1 h-6 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${isCorrect ? 'bg-success' : 'bg-magenta-gradient'}`}
              />
            </div>
            <div className="w-10 text-start text-gold-light font-bold">{c}</div>
          </div>
        );
      })}
    </div>
  );
}
