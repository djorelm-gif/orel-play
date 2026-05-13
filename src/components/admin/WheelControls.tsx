'use client';

import { useState } from 'react';
import { spinWheel, patchLiveSession, confirmWheelStop } from '@/lib/game-engine/host-actions';
import { GAME_TITLES } from '@/types/game';
import type { EventGame } from '@/types/game';
import type { LiveSession } from '@/types/live-session';

export function WheelControls({
  eventCode,
  games,
  liveSession,
}: {
  eventCode: string;
  games: EventGame[];
  liveSession: LiveSession;
}) {
  const [busy, setBusy] = useState(false);
  const enabled = games.filter((g) => g.is_enabled);
  const spinning = liveSession.wheel_status === 'spinning';

  async function go(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-gold"
          disabled={busy || enabled.length === 0}
          onClick={() => go(() => patchLiveSession(eventCode, { stage_state: 'WHEEL_IDLE', wheel_status: 'idle' }))}
        >
          הצג גלגל
        </button>
        <button
          className="btn-magenta"
          disabled={busy || enabled.length === 0}
          onClick={() => go(() => spinWheel(eventCode))}
        >
          {spinning ? 'מסתובב...' : '🎯 סובב גלגל'}
        </button>
      </div>
      <button
        className="btn-gold-outline w-full"
        disabled={busy || !liveSession.wheel_selected_game_id}
        onClick={() => go(() => confirmWheelStop(eventCode))}
      >
        אישור עצירה (אם המסך לא עבר אוטומטית)
      </button>
      <details>
        <summary className="text-sm text-muted cursor-pointer">בחירה ידנית של משחק</summary>
        <div className="grid grid-cols-1 gap-1 mt-2">
          {enabled.map((g) => (
            <button
              key={g.id}
              className="btn-ghost text-sm py-2"
              disabled={busy}
              onClick={() => go(() => spinWheel(eventCode, g.id))}
            >
              {GAME_TITLES[g.game_type]} →
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
