import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function GoldCard({
  children,
  className,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-3xl text-black p-6 overflow-hidden',
        glow && 'shadow-gold-glow',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, #FFE7A3 0%, #D8A84E 50%, #9C7732 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 1px, transparent 1px, transparent 8px)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
