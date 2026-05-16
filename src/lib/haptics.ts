'use client';

// Subtle haptic feedback for taps. On iOS this is a no-op (Safari doesn't
// expose the Vibration API), but Android Chrome will vibrate, and PWAs added
// to home screen on supported devices feel a tiny bit more "native". We keep
// the durations short so they read as "click" not "alert".

type Pattern = 'light' | 'medium' | 'heavy' | 'success' | 'warn' | 'error';

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: 28,
  success: [10, 30, 10],
  warn: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
};

export function haptic(pattern: Pattern = 'light'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* never throw from a UX effect */
  }
}
