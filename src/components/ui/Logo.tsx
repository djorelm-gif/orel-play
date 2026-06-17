'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const heightCls: Record<Size, string> = {
  sm: 'h-7',
  md: 'h-12',
  lg: 'h-20',
  xl: 'h-32',
};

// Renders the host's logo. Logo-only — no text fallback. If the file at
// public/logo.svg is missing or fails to load, the component returns null
// rather than printing the brand name, because the host wants the mark to
// stand alone everywhere it appears.
export function Logo({ size = 'md', className }: { size?: Size; className?: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt=""
      role="presentation"
      className={cn(heightCls[size], 'w-auto select-none', className)}
      onError={() => setErrored(true)}
      draggable={false}
    />
  );
}
