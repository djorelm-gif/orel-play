'use client';

import { patchLiveSession } from '@/lib/game-engine/host-actions';
import { STAGE_STATE_LABELS, type StageState } from '@/types/live-session';

const QUICK_STATES: StageState[] = ['JOIN_SCREEN', 'GREETINGS_WALL', 'WHEEL_IDLE', 'BREAK_SCREEN', 'FINAL_SCREEN'];

export function StageStateButtons({
  eventCode,
  current,
}: {
  eventCode: string;
  current: StageState;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {QUICK_STATES.map((s) => (
        <button
          key={s}
          onClick={() => patchLiveSession(eventCode, { stage_state: s })}
          className={`btn ${current === s ? 'btn-gold' : 'btn-ghost'} text-sm py-3`}
        >
          {STAGE_STATE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
