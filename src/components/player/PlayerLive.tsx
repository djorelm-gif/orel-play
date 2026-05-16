'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolledResource } from '@/lib/realtime/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { getGameDefinition } from '@/lib/game-engine/registry';
import { getAudio } from '@/lib/audio';
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

  // Mission cue when assigned
  const playedMissionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!myMission) return;
    if (playedMissionRef.current === myMission.id) return;
    playedMissionRef.current = myMission.id;
    getAudio().play('mission');
  }, [myMission]);

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
      <div className="min-h-screen flex items-center justify-center text-muted text-lg">טוען...</div>
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
          <Avatar name={me.display_name} photoUrl={me.photo_url} size="md" />
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

      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
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
