'use client';

import { useState } from 'react';
import { patchLiveSession } from '@/lib/game-engine/host-actions';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import type { GameQuestion } from '@/types/game';
import { STAGE_STATE_LABELS, type LiveSession } from '@/types/live-session';

interface Props {
  eventCode: string;
  liveSession: LiveSession;
  questions: GameQuestion[];
  answersCount: number;
}

// Shared host pattern: pick question → start → reveal → results → next.
export function HostQuestionControls({ eventCode, liveSession, questions, answersCount }: Props) {
  const [busy, setBusy] = useState(false);
  const activeIdx = questions.findIndex((q) => q.id === liveSession.active_question_id);
  const next = questions[activeIdx + 1] ?? questions[0];

  async function run(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await patchLiveSession(eventCode, patch);
    } finally {
      setBusy(false);
    }
  }

  const reveal = liveSession.stage_state === 'GAME_RESULTS';
  const active = liveSession.stage_state === 'GAME_ACTIVE';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-gold"
          disabled={busy}
          onClick={() =>
            run({
              stage_state: 'GAME_ACTIVE',
              active_question_id: next?.id ?? liveSession.active_question_id,
              // Stamp the moment the question went live so the stage can
              // drive a visible 30s countdown.
              current_payload: { ...liveSession.current_payload, activated_at: new Date().toISOString() },
            })
          }
        >
          {active ? 'שאלה הבאה ▶' : 'התחל שאלה'}
        </button>
        <button
          className="btn-magenta"
          disabled={busy || !active}
          onClick={() => run({ stage_state: 'GAME_RESULTS' })}
        >
          חשוף תשובה
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-ghost"
          disabled={busy}
          onClick={() => run({ stage_state: 'GAME_INTRO' })}
        >
          חזור לפתיח
        </button>
        <ConfirmButton
          className="btn-ghost border-danger/40 text-danger hover:bg-danger/10 w-full"
          disabled={busy}
          confirmLabel="לחצי שוב לסיום"
          onConfirm={() => run({ stage_state: 'BREAK_SCREEN', active_event_game_id: null, active_question_id: null })}
        >
          סיים משחק
        </ConfirmButton>
      </div>
      <div className="text-sm text-muted">
        שאלה {Math.max(0, activeIdx) + 1} מתוך {questions.length} · תשובות שהגיעו: <span className="text-gold">{answersCount}</span> · מצב:{' '}
        <span className="text-gold">{STAGE_STATE_LABELS[liveSession.stage_state]}</span>
        {reveal && ' · מצב חשיפה פעיל'}
      </div>
    </div>
  );
}
