'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Inline two-step confirm — first click shows "האם בטוח?", second click within 4s confirms.
// Lightweight alternative to a full modal; doesn't break event flow.
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'בטוח?',
  className,
  disabled,
  timeoutMs = 4000,
}: {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
  timeoutMs?: number;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = async () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), timeoutMs);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    await onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(armed ? 'btn-danger animate-pulse' : '', className)}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
