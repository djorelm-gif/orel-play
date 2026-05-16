'use client';

import { useEffect } from 'react';
import type { EventType } from '@/types/event';

// Sets data-theme on <html> so CSS variables (and Tailwind classes bound to them) swap palette.
export function ThemeApplier({ eventType }: { eventType: EventType }) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', eventType);
    return () => {
      // Restore default theme when navigating away from an event-scoped page
      if (prev) root.setAttribute('data-theme', prev);
      else root.removeAttribute('data-theme');
    };
  }, [eventType]);
  return null;
}
