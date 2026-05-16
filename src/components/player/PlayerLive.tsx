'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolledResource } from '@/lib/realtime/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { getGameDefinition } from '@/lib/game-engine/registry';
import { getAudio } from '@/lib/audio';
import { notify } from '@/lib/notifications';
import { haptic } from '@/lib/haptics';
import { compressImage } from '@/lib/image';
import type { OrelEvent } from '@/types/event';
import type { LiveSession, StageState } from '@/types/live-session';
import type { Player } from '@/types/player';
import type { Greeting } from '@/types/greeting';
import type { EventGame, GameQuestion, PlayerAnswer, SecretMission } from '@/types/game';

interface Snapshot {
  event: OrelEvent;
  liveSession: LiveSession | null;
  players: Player[];
  approvedGreetings: Greeting[];
  eventGames: EventGame[];
  activeQuestion: GameQuestion | null;
  activeGameAnswers: PlayerAnswer[];
  missions?: SecretMission[];
}

const STORAGE_KEY = 'orelplay.session';

export function PlayerLive({ eventCode, initial }: { eventCode: string; initial: Snapshot }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Player | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}.${eventCode}`);
      if (!raw) {
        router.replace(`/join/${eventCode}`);
        return;
      }
      const data = JSON.parse(raw) as { token: string; playerId: string };
      setToken(data.token);
    } catch {
      router.replace(`/join/${eventCode}`);
    }
  }, [eventCode, router]);

  // Resolve player from token (handles dev server restarts where the demo store reset)
  useEffect(() => {
    if (!token) return;
    fetch(`/api/players/me?token=${token}`)
      .then((r) => r.json())
      .then((data: { player: Player | null }) => {
        if (!data.player) {
          // session orphaned (demo store reset). Force re-join.
          localStorage.removeItem(`${STORAGE_KEY}.${eventCode}`);
          router.replace(`/join/${eventCode}`);
          return;
        }
        setMe(data.player);
      })
      .catch(() => {});
  }, [token, eventCode, router]);

  const { data, online } = usePolledResource<Snapshot>(`/api/events/${eventCode}/snapshot`, {
    initialValue: initial,
  });
  const snap = data ?? initial;
  const live = snap.liveSession;
  const state: StageState = live?.stage_state ?? 'JOIN_SCREEN';
  const activeGame = snap.eventGames.find((g) => g.id === live?.active_event_game_id);
  const myAnswer = useMemo(() => snap.activeGameAnswers.find((a) => a.player_id === me?.id) ?? null, [snap.activeGameAnswers, me]);
  const myMission = useMemo(
    () => snap.missions?.find((m) => m.assigned_to_player_id === me?.id && m.status === 'assigned') ?? null,
    [snap.missions, me],
  );

  // Play correct/wrong sound when results are revealed
  const playedRevealRef = useRef<string | null>(null);
  useEffect(() => {
    if (state !== 'GAME_RESULTS' || !myAnswer) return;
    const key = `${myAnswer.id}:reveal`;
    if (playedRevealRef.current === key) return;
    playedRevealRef.current = key;
    getAudio().play(myAnswer.is_correct ? 'correct' : 'wrong');
  }, [state, myAnswer]);

  // Mission cue when assigned (sound + system notification)
  const playedMissionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!myMission) return;
    if (playedMissionRef.current === myMission.id) return;
    playedMissionRef.current = myMission.id;
    getAudio().play('mission');
    notify('🤫 משימה חשאית!', {
      body: 'פתח/י את האפליקציה — קיבלת משימה רק בשבילך.',
      tag: `mission:${myMission.id}`,
    });
  }, [myMission]);

  // System notifications on meaningful stage transitions. We fire only when the
  // state *changes*, never on first mount, so refreshing in the middle of a
  // game won't pop a stale notification.
  const prevStateRef = useRef<StageState | null>(null);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === null || prev === state) return;

    if (state === 'WHEEL_SPINNING') {
      notify('🎡 הגלגל מסתובב!', {
        body: 'איזה משחק יוצא? פתח/י את האפליקציה.',
        tag: `stage:${state}:${live?.updated_at ?? ''}`,
      });
    }
    if (state === 'GAME_INTRO' && activeGame) {
      notify(`🎮 ${activeGame.title}`, {
        body: 'תכף מתחילים. פתח/י את המסך.',
        tag: `stage:${state}:${live?.active_event_game_id ?? ''}`,
      });
    }
    if (state === 'GAME_ACTIVE') {
      notify('⚡ ענה עכשיו!', {
        body: 'השאלה פעילה — שניות ספורות לענות.',
        tag: `stage:${state}:${live?.active_question_id ?? ''}`,
      });
    }
    if (state === 'BREAK_SCREEN') {
      notify('☕ הפסקה קצרה', {
        body: 'תכף ממשיכים. השאר/י את הטלפון פתוח.',
        tag: `stage:${state}:${live?.updated_at ?? ''}`,
      });
    }
    if (state === 'FINAL_SCREEN') {
      notify('🎉 זה הסוף!', {
        body: 'תודה שהייתם איתנו. ראה/י את הניקוד הסופי.',
        tag: `stage:${state}`,
      });
    }
  }, [state, activeGame, live?.updated_at, live?.active_event_game_id, live?.active_question_id]);

  async function submitAnswer({ answer_text }: { answer_text: string }) {
    if (!token) return;
    await fetch(`/api/events/${eventCode}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: token, answer_text, response_time_ms: 4000 }),
    });
  }

  if (!me) {
    return (
      <div className="min-h-screen stage-vignette p-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="skeleton size-12 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2 text-end">
            <div className="skeleton h-3 w-16 ms-auto" />
            <div className="skeleton h-4 w-20 ms-auto" />
          </div>
        </div>
        <div className="skeleton h-20 w-full mb-4 rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen stage-vignette p-4 pb-10">
      <ThemeApplier eventType={snap.event.event_type} />
      {!online && (
        <div className="mb-3 panel-strong border border-danger/50 p-3 flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full bg-danger animate-pulse" />
          <span>אין חיבור — מחדשים אוטומטית...</span>
        </div>
      )}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PhotoButton me={me} token={token} onUpdated={(url) => setMe({ ...me, photo_url: url })} />
          <div>
            <div className="font-bold leading-tight">{me.display_name}</div>
            <div className="text-xs text-muted">ניקוד: {me.total_score}</div>
          </div>
        </div>
        <div className="text-end flex items-center gap-2">
          <div>
            <div className="text-xs text-muted">קוד אירוע</div>
            <div className="font-bold tracking-widest text-gold">{snap.event.event_code}</div>
          </div>
        </div>
      </header>

      <ParticipateToggle me={me} token={token} onLocalChange={(next) => setMe({ ...me, wants_to_participate: next })} />

      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.6 }}
        >
          {state === 'JOIN_SCREEN' && <WaitingCard title="נכנסת למשחק 🔥" subtitle="תישאר/י עם הטלפון פתוח — עוד רגע מתחילים" />}
          {state === 'GREETINGS_WALL' && <WaitingCard title="קוראים את הברכות" subtitle="הברכה שלך עוד תופיע במסך הגדול" />}
          {(state === 'WHEEL_IDLE' || state === 'WHEEL_SPINNING') && (
            <WaitingCard
              title="הגלגל מסתובב..."
              subtitle="איזה משחק יוצא עכשיו?"
              tone="magenta"
            />
          )}
          {state === 'GAME_INTRO' && activeGame && (
            <WaitingCard
              title={`המשחק שנבחר: ${activeGame.title}`}
              subtitle="המתנה לתחילת המשחק..."
              tone="gold"
            />
          )}
          {(state === 'GAME_ACTIVE' || state === 'GAME_RESULTS') && activeGame && (
            <ActivePlayerGame
              snap={snap}
              live={live!}
              eventGame={activeGame}
              me={me}
              myAnswer={myAnswer}
              myMission={myMission}
              submitAnswer={submitAnswer}
            />
          )}
          {state === 'BREAK_SCREEN' && <WaitingCard title="הפסקה קצרה" subtitle="תכף ממשיכים" />}
          {state === 'FINAL_SCREEN' && <WaitingCard title="זה הסוף!" subtitle="תודה שהייתם איתנו ❤" tone="gold" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Tap-to-change avatar. The original photo can be lost (we strip oversized
// data URLs on the server), or a player just wants to swap the photo without
// re-joining. Compression + the 250KB cap on the server keep poll responses
// small.
function PhotoButton({
  me,
  token,
  onUpdated,
}: {
  me: Player;
  token: string | null;
  onUpdated: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | null) {
    if (!file || !token) return;
    haptic('light');
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      const res = await fetch('/api/players/me/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, photo_url: dataUrl }),
      });
      const data = (await res.json()) as { player?: Player; error?: string };
      if (!res.ok || !data.player) {
        haptic('error');
        setError(data.error ?? 'נכשל לשמור תמונה');
        return;
      }
      haptic('success');
      onUpdated(data.player.photo_url ?? dataUrl);
    } catch {
      haptic('error');
      setError('נכשל לקרוא את התמונה');
    } finally {
      setBusy(false);
    }
  }

  const missing = !me.photo_url;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="relative size-12 rounded-full overflow-hidden tap-press group"
        aria-label="החלף תמונה"
      >
        <Avatar name={me.display_name} photoUrl={me.photo_url} size="md" />
        <span
          className={`absolute inset-0 rounded-full flex items-center justify-center text-xs font-bold transition ${
            missing
              ? 'bg-black/60 text-gold border-2 border-gold border-dashed'
              : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 text-white'
          }`}
        >
          {busy ? '...' : missing ? '+תמונה' : 'החלף'}
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {error && (
        <div className="absolute top-full mt-1 start-0 text-xs text-danger whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

function ParticipateToggle({
  me,
  token,
  onLocalChange,
}: {
  me: Player;
  token: string | null;
  onLocalChange: (next: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const isF = me.gender === 'female';
  async function toggle() {
    if (!token || busy) return;
    const next = !me.wants_to_participate;
    onLocalChange(next);
    setBusy(true);
    try {
      await fetch('/api/players/me/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, wants: next }),
      });
    } finally {
      setBusy(false);
    }
  }
  const on = me.wants_to_participate;
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`mb-4 w-full rounded-2xl p-4 flex items-center gap-3 text-start transition ${
        on
          ? 'bg-gold-gradient text-black shadow-gold-glow'
          : 'panel-strong text-white hover:bg-white/12'
      }`}
    >
      <div className="text-3xl">{on ? '🙋' : '🪑'}</div>
      <div className="flex-1">
        <div className="font-bold text-lg leading-tight">
          {on
            ? isF
              ? 'את בפנים למשחקים אישיים'
              : 'אתה בפנים למשחקים אישיים'
            : isF
              ? 'רוצה להשתתף במשחקים אישיים?'
              : 'רוצה להשתתף במשחקים אישיים?'}
        </div>
        <div className={`text-sm ${on ? 'text-black/70' : 'text-muted'}`}>
          {on
            ? 'יוכלו לקרוא לך לכיסאות, משימה סודית ועוד'
            : 'כיסאות, משימה סודית, ועוד — לחץ/י כאן'}
        </div>
      </div>
      <div className={`text-sm font-bold ${on ? 'text-black' : 'text-gold'}`}>{on ? 'בפנים ✓' : 'הצטרף'}</div>
    </button>
  );
}

function WaitingCard({
  title,
  subtitle,
  tone = 'default',
}: {
  title: string;
  subtitle: string;
  tone?: 'default' | 'gold' | 'magenta';
}) {
  return (
    <div
      className={`rounded-3xl p-8 text-center space-y-2 panel-strong ${
        tone === 'gold' ? 'shadow-gold-glow' : tone === 'magenta' ? 'shadow-magenta-glow' : ''
      }`}
    >
      <div className="text-3xl font-display font-black gold-shimmer">{title}</div>
      <div className="text-muted text-lg">{subtitle}</div>
    </div>
  );
}

function ActivePlayerGame({
  snap,
  live,
  eventGame,
  me,
  myAnswer,
  myMission,
  submitAnswer,
}: {
  snap: Snapshot;
  live: LiveSession;
  eventGame: EventGame;
  me: Player;
  myAnswer: PlayerAnswer | null;
  myMission: SecretMission | null;
  submitAnswer: (input: { answer_text: string }) => Promise<void>;
}) {
  const def = getGameDefinition(eventGame.game_type);
  const PlayerCmp = def.player;
  return (
    <PlayerCmp
      event={snap.event}
      liveSession={live}
      eventGame={eventGame}
      question={snap.activeQuestion}
      player={me}
      hasAnswered={!!myAnswer}
      myAnswer={myAnswer}
      myMission={myMission}
      submitAnswer={submitAnswer}
    />
  );
}
