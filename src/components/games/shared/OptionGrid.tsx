'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface OptionGridProps {
  options: Array<{ id: string; label: string }>;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  correctId?: string | null;
  reveal?: boolean;
  disabled?: boolean;
  variant?: 'player' | 'stage';
  columns?: 1 | 2;
}

export function OptionGrid({
  options,
  onSelect,
  selectedId,
  correctId,
  reveal,
  disabled,
  variant = 'player',
  columns = 1,
}: OptionGridProps) {
  return (
    <div className={cn('grid gap-3', columns === 2 ? 'grid-cols-2' : 'grid-cols-1', variant === 'stage' && 'gap-5')}>
      {options.map((opt) => {
        const isMine = selectedId === opt.id;
        const isCorrect = reveal && correctId === opt.id;
        const isWrong = reveal && isMine && correctId !== opt.id;

        return (
          <motion.button
            key={opt.id}
            disabled={disabled}
            onClick={() => {
              haptic('light');
              onSelect?.(opt.id);
            }}
            whileTap={disabled ? undefined : { scale: 0.96 }}
            animate={
              isMine && !reveal
                ? { scale: [1, 1.04, 1] }
                : isCorrect
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
            }
            transition={{
              scale: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
            }}
            className={cn(
              'rounded-2xl px-5 py-5 text-start font-bold border w-full will-change-transform',
              'transition-[background-color,border-color,box-shadow,color] duration-200 ease-out',
              variant === 'player' ? 'text-xl' : 'text-3xl py-7',
              !reveal && !isMine && 'bg-white/6 border-white/12 hover:bg-white/12 text-white',
              isMine && !reveal && 'bg-gold-gradient text-black border-gold shadow-gold-glow',
              isCorrect && 'bg-success/25 border-success text-success shadow-[0_0_40px_rgba(71,255,178,0.35)]',
              isWrong && 'bg-danger/25 border-danger text-danger',
              reveal && !isMine && !isCorrect && 'bg-white/5 border-white/10 text-muted opacity-70',
              disabled && !isMine && 'opacity-60',
            )}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
