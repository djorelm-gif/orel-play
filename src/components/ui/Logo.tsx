'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const heightCls: Record<Size, string> = {
  sm: 'h-5',
  md: 'h-9',
  lg: 'h-14',
  xl: 'h-24',
};

const fallbackTextCls: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-7xl md:text-8xl',
};

// Renders the Orel Productions logo. The component tries each source in order:
//   1. /logo.png  — drop your real logo here (PNG with transparent background)
//   2. /logo.svg  — gold-gradient wordmark placeholder shipped with the repo
//   3. text       — final fallback if both files are missing
// Saving a file at public/logo.png automatically overrides the placeholder
// without any code change — Next.js serves it from the same path.
const SOURCES = ['/logo.png', '/logo.svg'];

export function Logo({ size = 'md', className }: { size?: Size; className?: string }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        className={cn(
          'font-display font-black gold-shimmer whitespace-nowrap',
          fallbackTextCls[size],
          className,
        )}
      >
        אורל פרודקשנס
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOURCES[srcIdx]}
      alt="Orel Productions"
      className={cn(heightCls[size], 'w-auto select-none', className)}
      onError={() => {
        if (srcIdx < SOURCES.length - 1) setSrcIdx(srcIdx + 1);
        else setErrored(true);
      }}
      draggable={false}
    />
  );
}
