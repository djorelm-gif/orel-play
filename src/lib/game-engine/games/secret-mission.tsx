'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { assignMission, updateMission, patchLiveSession } from '@/lib/game-engine/host-actions';
import { STAGE_STATE_LABELS } from '@/types/live-session';
import type { GameDefinition, StageProps, PlayerProps, HostControlsProps } from '../types';

function Stage({ liveSession, players, missions }: StageProps) {
  const activeMissionId = (liveSession.current_payload as { active_mission_id?: string })?.active_mission_id;
  const mission = missions?.find((m) => m.id === activeMissionId) ?? null;
  const target = mission?.assigned_to_player_id
    ? players.find((p) => p.id === mission.assigned_to_player_id) ?? null
    : null;

  const reveal = liveSession.stage_state === 'GAME_RESULTS' && mission;
  const intro = liveSession.stage_state === 'GAME_INTRO';

  if (intro) {
    return (
      <div className="relative z-10 flex h-full items-center justify-center px-12">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'backOut' }}
          className="text-center space-y-6"
        >
          <div className="text-7xl">🤫</div>
          <h1 className="stage-headline font-display gold-shimmer">משימה סודית</h1>
          <div className="text-2xl text-muted">מישהו במקום עומד לקבל משימה...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center space-y-6">
      <div className="text-7xl">🤫</div>
      <h2 className="font-display font-black text-5xl gold-shimmer">משימה סודית בדרך…</h2>
      {!reveal && (
        <>
          <p className="stage-subheadline text-muted max-w-3xl">תסתכלו טוב טוב סביבכם. אחד מכם בדיוק מקבל משימה לטלפון.</p>
          <div className="panel-strong p-6 inline-flex items-center gap-4">
            <div className="size-3 rounded-full bg-magenta animate-pulse" />
            <div className="text-2xl">הזמן מתחיל לרוץ...</div>
          </div>
        </>
      )}
      {reveal && mission && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel-strong max-w-4xl p-10 space-y-5"
        >
          {target && (
            <div className="flex items-center justify-center gap-4">
              <Avatar name={target.display_name} photoUrl={target.photo_url} size="xl" />
              <div className="text-start">
                <div className="text-sm text-muted">המשימה ניתנה ל-</div>
                <div className="text-4xl font-display font-black text-gold-light">{target.display_name}</div>
              </div>
            </div>
          )}
          <div className="text-3xl">{mission.mission_text}</div>
          <div
            className={`text-4xl font-display font-black ${
              mission.status === 'success' ? 'text-success' : mission.status === 'fail' ? 'text-danger' : 'text-magenta'
            }`}
          >
            {mission.status === 'success' && '✓ הצליחה!'}
            {mission.status === 'fail' && '✗ לא הצליחה'}
            {mission.status === 'assigned' && '⏳ ממתינים לתוצאה'}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PlayerCmp({ player, eventGame, myMission, liveSession }: PlayerProps) {
  const isMine = myMission && myMission.assigned_to_player_id === player.id && myMission.event_game_id === eventGame.id;
  if (!isMine) {
    return (
      <div className="space-y-4">
        <div className="panel-strong p-6 text-center space-y-2">
          <div className="text-4xl">👀</div>
          <div className="text-2xl font-bold">מישהו קיבל משימה סודית...</div>
          <div className="text-muted">תסתכלו טוב טוב סביבכם</div>
        </div>
        {liveSession.stage_state === 'GAME_RESULTS' && (
          <div className="panel p-4 text-center">המשימה נחשפה במסך הגדול 👆</div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="space-y-4"
    >
      <div className="rounded-3xl p-6 text-black bg-gold-gradient shadow-gold-glow space-y-3">
        <div className="text-sm font-bold tracking-[0.3em]">משימה סודית · 🤫</div>
        <div className="text-3xl font-display font-black leading-snug">{myMission.mission_text}</div>
        <div className="text-base font-bold">יש לך 30 שניות. אל תספר/י לאף אחד!</div>
      </div>
      <div className="text-center text-muted text-sm">המנחה יחליט אם הצלחת</div>
    </motion.div>
  );
}

function Host({ event, eventGame, players, missions, liveSession, questions }: HostControlsProps) {
  const [busy, setBusy] = useState(false);
  const [missionIdx, setMissionIdx] = useState(0);
  const activeMissionId = (liveSession.current_payload as { active_mission_id?: string })?.active_mission_id;
  const activeMission = missions.find((m) => m.id === activeMissionId);

  const missionPool = questions.length > 0
    ? questions.map((q) => q.question_text)
    : ['גרום/י לשולחן שלך לעמוד ולמחוא כפיים תוך 30 שניות'];

  const optedIn = players.filter((p) => p.status === 'active' && p.wants_to_participate);

  async function send() {
    setBusy(true);
    try {
      await assignMission(event.event_code, {
        event_game_id: eventGame.id,
        mission_text: missionPool[missionIdx],
      });
      await patchLiveSession(event.event_code, { stage_state: 'GAME_ACTIVE' });
    } finally {
      setBusy(false);
    }
  }

  async function mark(status: 'success' | 'fail') {
    if (!activeMission) return;
    setBusy(true);
    try {
      await updateMission(event.event_code, { mission_id: activeMission.id, status });
      await patchLiveSession(event.event_code, { stage_state: 'GAME_RESULTS' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs text-muted">בחרו משימה</div>
        <select
          value={missionIdx}
          onChange={(e) => setMissionIdx(Number(e.target.value))}
          className="w-full rounded-xl bg-white/8 border border-white/15 px-3 py-2"
        >
          {missionPool.map((m, i) => (
            <option key={i} value={i} className="bg-black">
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="panel p-2 text-xs text-muted">
        {optedIn.length > 0
          ? `${optedIn.length} שחקנים התנדבו — נגריל מהם`
          : 'אף אחד לא לחץ "להשתתף" — נגריל מכל הפעילים'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-gold" disabled={busy} onClick={send}>
          🎲 שלח לאקראי
        </button>
        <button
          className="btn-ghost"
          disabled={busy || !activeMission}
          onClick={() => patchLiveSession(event.event_code, { stage_state: 'GAME_RESULTS' })}
        >
          הצג ספירה לאחור
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-gold-outline" disabled={busy || !activeMission} onClick={() => mark('success')}>
          הצליחה ✓
        </button>
        <button className="btn-danger" disabled={busy || !activeMission} onClick={() => mark('fail')}>
          לא הצליחה
        </button>
      </div>
      {activeMission && (
        <div className="panel p-3 text-sm">
          משימה פעילה: <span className="text-gold-light">{activeMission.mission_text}</span> →{' '}
          {players.find((p) => p.id === activeMission.assigned_to_player_id)?.display_name ?? '—'}
        </div>
      )}
      <div className="text-xs text-muted">מצב: {STAGE_STATE_LABELS[liveSession.stage_state]}</div>
    </div>
  );
}

export const secretMission: GameDefinition = {
  type: 'secret_mission',
  title: 'משימה סודית',
  description: 'משימה חשאית נשלחת לילד או לשולחן',
  emoji: '🤫',
  defaultConfig: { timer_seconds: 30 },
  stage: Stage,
  player: PlayerCmp,
  hostControls: Host,
};
