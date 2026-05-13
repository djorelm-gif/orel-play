'use client';

import { cn } from '@/lib/utils';

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
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => onSelect?.(opt.id)}
            className={cn(
              'rounded-2xl px-5 py-5 text-start font-bold transition-all border w-full',
              variant === 'player' ? 'text-xl' : 'text-3xl py-7',
              !reveal && !isMine && 'bg-white/6 border-white/12 hover:bg-white/12 text-white',
              isMine && !reveal && 'bg-gold-gradient text-black border-gold shadow-gold-glow',
              isCorrect && 'bg-success/30 border-success text-success animate-pulse-gold',
              isWrong && 'bg-danger/30 border-danger text-danger',
              reveal && !isMine && !isCorrect && 'bg-white/5 border-white/10 text-muted opacity-70',
              disabled && !isMine && 'opacity-60',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
