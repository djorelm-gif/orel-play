'use client';

import { useState } from 'react';
import { patchLiveSession } from '@/lib/game-engine/host-actions';
import { haptic } from '@/lib/haptics';
import { STAGE_STATE_LABELS, type StageState } from '@/types/live-session';

const QUICK_STATES: StageState[] = ['JOIN_SCREEN', 'GREETINGS_WALL', 'WHEEL_IDLE', 'BREAK_SCREEN', 'FINAL_SCREEN'];

export function StageStateButtons({
  eventCode,
  current,
  onChanged,
}: {
  eventCode: string;
  current: StageState;
  onChanged?: () => void;
}) {
  // Track the pending state so the clicked button highlights gold instantly,
  // even before the snapshot poll confirms — feels much snappier than waiting
  // 1-2s for the chip to catch up.
  const [pending, setPending] = useState<StageState | null>(null);
  const active = pending ?? current;

  async function pick(s: StageState) {
    haptic('light');
    setPending(s);
    try {
      await patchLiveSession(eventCode, { stage_state: s });
      onChanged?.();
    } finally {
      // clear after the next render — by then the poll will have caught up.
      setTimeout(() => setPending((p) => (p === s ? null : p)), 800);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {QUICK_STATES.map((s) => (
        <button
          key={s}
          onClick={() => pick(s)}
          className={`btn ${active === s ? 'btn-gold' : 'btn-ghost'} text-sm py-3`}
        >
          {STAGE_STATE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
