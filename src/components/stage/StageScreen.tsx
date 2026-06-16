'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePolledResource } from '@/lib/realtime/hooks';
import { StageBackdrop } from '@/components/ui/StageBackdrop';
import { JoinScreen } from './JoinScreen';
import { GreetingsWall } from './GreetingsWall';
import { WheelStage } from './WheelStage';
import { Leaderboard } from './Leaderboard';
import { Confetti } from '@/components/ui/Confetti';
import { MuteToggle } from '@/components/ui/MuteToggle';
import { FullscreenButton } from '@/components/ui/FullscreenButton';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { Logo } from '@/components/ui/Logo';
import { RibbonIcon } from '@/components/ui/icons/GoldIcon';
import { getGameDefinition } from '@/lib/game-engine/registry';
import { confirmWheelStop, patchLiveSession } from '@/lib/game-engine/host-actions';
import { getAudio } from '@/lib/audio';
import type { OrelEvent } from '@/types/event';
import { STAGE_STATE_LABELS, type LiveSession, type StageState } from '@/types/live-session';
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

interface Props {
  eventCode: string;
  joinUrl: string;
  initial: Snapshot;
}

export function StageScreen({ eventCode, joinUrl, initial }: Props) {
  const { data } = usePolledResource<Snapshot>(`/api/events/${eventCode}/snapshot`, { initialValue: initial });
  // When this stage is embedded in the admin host preview, the host pushes its
  // latest liveSession to us via postMessage on every state change so the
  // visible card flips instantly — we don't wait for our own 2.5s poll.
  // Heavier sub-data (player count, vote tallies) still arrives via polling.
  const [pushedLive, setPushedLive] = useState<LiveSession | null>(null);
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const msg = ev.data;
      if (msg && msg.type === 'orel:live-session' && msg.eventCode === eventCode && msg.liveSession) {
        setPushedLive(msg.liveSession as LiveSession);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [eventCode]);
  const polledSnap = data ?? initial;
  // Prefer the pushed liveSession when it's newer than what we've polled.
  const snap: Snapshot = useMemo(() => {
    if (!pushedLive) return polledSnap;
    const polledTime = polledSnap.liveSession?.updated_at ?? '';
    if (pushedLive.updated_at >= polledTime) {
      return { ...polledSnap, liveSession: pushedLive };
    }
    return polledSnap;
  }, [polledSnap, pushedLive]);
  const live = snap.liveSession;
  const state: StageState = live?.stage_state ?? 'JOIN_SCREEN';
  const [confettiKey, setConfettiKey] = useState(0);
  const prevState = useRef<StageState>(state);
  const prevWheelStatus = useRef(live?.wheel_status);

  // Confetti + sound on state transitions
  useEffect(() => {
    const audio = getAudio();
    const from = prevState.current;
    prevState.current = state;
    if (from === state) return;

    if (state === 'GAME_RESULTS' || state === 'FINAL_SCREEN') {
      setConfettiKey((k) => k + 1);
      audio.play('confetti');
    }
    if (state === 'GAME_INTRO') {
      audio.play('reveal');
    }
  }, [state]);

  // Sound + confetti on wheel state changes
  useEffect(() => {
    const audio = getAudio();
    const prev = prevWheelStatus.current;
    prevWheelStatus.current = live?.wheel_status;
    if (prev === live?.wheel_status) return;
    if (live?.wheel_status === 'spinning') {
      // 1-second drum-roll clip loops until the wheel lands
      audio.loop('wheel_spin');
    }
    if (live?.wheel_status === 'stopped') {
      audio.stop('wheel_spin');
      audio.play('wheel_stop');
      setConfettiKey((k) => k + 1);
    }
    if (live?.wheel_status === 'idle' && prev === 'spinning') {
      audio.stop('wheel_spin');
    }
  }, [live?.wheel_status]);

  // Musical-chairs winner triggers a big celebration
  const lastWinnerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const winnerId = (live?.current_payload as { winner_player_id?: string } | undefined)?.winner_player_id;
    if (!winnerId || winnerId === lastWinnerRef.current) return;
    lastWinnerRef.current = winnerId;
    setConfettiKey((k) => k + 1);
    getAudio().play('confetti');
  }, [live?.current_payload]);

  // Auto-advance: when a game ends and the event has auto_advance_after_results
  // turned on, flip back to the wheel after an 8-sec breather. The countdown
  // chip below reflects this same window so the host can see exactly when the
  // wheel reappears.
  const AUTO_ADVANCE_SECONDS = 8;
  const autoAdvanceEnabled = state === 'GAME_RESULTS' && snap.event.auto_advance_after_results;
  const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!autoAdvanceEnabled) {
      setAutoAdvanceRemaining(null);
      return;
    }
    const startedAt = Date.now();
    setAutoAdvanceRemaining(AUTO_ADVANCE_SECONDS);
    const tick = window.setInterval(() => {
      const left = Math.max(0, AUTO_ADVANCE_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
      setAutoAdvanceRemaining(left);
    }, 250);
    const fire = window.setTimeout(() => {
      patchLiveSession(eventCode, {
        stage_state: 'WHEEL_IDLE',
        active_event_game_id: null,
        active_question_id: null,
        current_payload: {},
        wheel_status: 'idle',
        wheel_selected_game_id: null,
      }).catch(() => {
        // Host can recover manually if this fails.
      });
    }, AUTO_ADVANCE_SECONDS * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(fire);
      setAutoAdvanceRemaining(null);
    };
  }, [autoAdvanceEnabled, eventCode]);

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-white">
      <ThemeApplier eventType={snap.event.event_type} />
      {/* Backdrop gets its own gentle re-entry on state change so the bg
          appears to slide slower than the content — that's the parallax. */}
      <motion.div
        key={`bg-${state}`}
        initial={{ opacity: 0.6, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <StageBackdrop />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.96, y: 14, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.04, y: -8, filter: 'blur(6px)' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {state === 'JOIN_SCREEN' && (
            <JoinScreen event={snap.event} players={snap.players} joinUrl={joinUrl} />
          )}
          {state === 'GREETINGS_WALL' && (
            <GreetingsWall
              greetings={snap.approvedGreetings}
              childName={snap.event.child_name}
              joinUrl={joinUrl}
              eventCode={snap.event.event_code}
            />
          )}
          {(state === 'WHEEL_IDLE' || state === 'WHEEL_SPINNING') && live && (
            <WheelStage
              games={snap.eventGames}
              liveSession={live}
              childName={snap.event.child_name}
              onSpinComplete={() => confirmWheelStop(eventCode)}
            />
          )}
          {(state === 'GAME_INTRO' || state === 'GAME_ACTIVE' || state === 'GAME_RESULTS') && live && (
            <ActiveGameStage snapshot={snap} liveSession={live} />
          )}
          {state === 'BREAK_SCREEN' && (
            <div className="relative z-10 flex h-full items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                className="space-y-5"
              >
                <h1 className="stage-headline-editorial font-editorial gold-shimmer">הפסקה קצרה</h1>
                <p className="stage-subheadline text-muted">תכף ממשיכים — הישארו איתנו</p>
              </motion.div>
            </div>
          )}
          {state === 'FINAL_SCREEN' && (
            <FinalScreen event={snap.event} players={snap.players} />
          )}
        </motion.div>
      </AnimatePresence>

      <Confetti trigger={confettiKey} />

      {autoAdvanceRemaining !== null && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 end-6 z-30 rounded-full px-4 py-2 flex items-center gap-2 text-sm border border-white/15"
          style={{
            background: 'rgba(5,5,6,0.6)',
            backdropFilter: 'blur(10px) saturate(160%)',
            WebkitBackdropFilter: 'blur(10px) saturate(160%)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,231,163,0.18)',
          }}
        >
          <span className="size-1.5 rounded-full bg-gold-light animate-pulse" />
          <span className="text-muted">ממשיכים בעוד</span>
          <span className="font-display font-black text-gold-light tabular-nums">{autoAdvanceRemaining}…</span>
        </motion.div>
      )}

      {(state === 'GAME_ACTIVE' || state === 'GAME_RESULTS') && (
        <MiniScoreboard players={snap.players} />
      )}

      <div className="absolute bottom-4 start-6 text-xs text-muted/60 flex items-center gap-2 z-20 opacity-70">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        <Logo size="sm" className="opacity-90" />
        <span>· {snap.event.event_code}</span>
        {state !== 'JOIN_SCREEN' && <span className="ms-2">· {STAGE_STATE_LABELS[state]}</span>}
      </div>

      <div className="absolute bottom-4 end-6 z-20 flex items-center gap-2">
        <MuteToggle />
        <FullscreenButton />
      </div>
    </div>
  );
}

function FinalScreen({ event, players }: { event: OrelEvent; players: Player[] }) {
  return (
    <div className="relative z-10 h-full overflow-y-auto scrollbar-fancy">
      <div className="min-h-full flex flex-col items-center justify-start gap-12 px-12 py-16">
        {/* Editorial hero — gold ribbon-style emblem above, the kid's name in
            a serif display, then a refined "תודה" line. Staggered so the
            elements arrive one after the other like a keynote opening. */}
        <div className="text-center space-y-6 max-w-5xl">
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
            className="flex justify-center"
          >
            <RibbonIcon size={88} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.18 }}
          >
            <h1
              className="font-editorial font-black gold-shimmer leading-none"
              style={{ fontSize: 'clamp(80px, 13vw, 220px)', letterSpacing: '-0.03em' }}
            >
              {event.child_name}
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.42 }}
            className="space-y-3"
          >
            {/* Thin gold separator — keynote-style hairline above the secondary line. */}
            <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
            <div className="stage-headline-editorial font-editorial text-gold-light/90">
              תודה
            </div>
            <p className="stage-subheadline text-muted">{event.name}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
          className="w-full"
        >
          <Leaderboard players={players} eventType={event.event_type} />
        </motion.div>
      </div>
    </div>
  );
}

// Floating top-3 leaders chip pinned to the bottom-left during active games.
// Subtle dark glass so it doesn't compete with the main stage content.
// Sits above the event-code footer so they don't overlap.
function MiniScoreboard({ players }: { players: Player[] }) {
  const top3 = players
    .filter((p) => p.status !== 'kicked' && !p.is_child_star)
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3);
  if (top3.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-16 start-6 z-20 max-w-md rounded-2xl px-4 py-2 flex items-center gap-3 text-sm border border-white/10"
      style={{
        background: 'rgba(5, 5, 6, 0.65)',
        backdropFilter: 'blur(12px) saturate(160%)',
        WebkitBackdropFilter: 'blur(12px) saturate(160%)',
      }}
    >
      <span className="text-xs text-muted tracking-wider">מובילים</span>
      <span className="flex items-center gap-3 text-white/90">
        {top3.map((p, i) => (
          <span key={p.id} className="flex items-center gap-1">
            <span className="text-gold-light/80 text-xs">{i + 1}.</span>
            <span className="font-bold">{p.display_name}</span>
            <span className="text-gold-light/80">({p.total_score})</span>
          </span>
        ))}
      </span>
    </motion.div>
  );
}

function ActiveGameStage({ snapshot, liveSession }: { snapshot: Snapshot; liveSession: LiveSession }) {
  const eventGame = snapshot.eventGames.find((g) => g.id === liveSession.active_event_game_id);
  if (!eventGame) {
    return (
      <div className="relative z-10 flex h-full items-center justify-center text-2xl text-muted">
        אין משחק פעיל
      </div>
    );
  }
  const def = getGameDefinition(eventGame.game_type);
  const Stage = def.stage;
  return (
    <Stage
      event={snapshot.event}
      liveSession={liveSession}
      eventGame={eventGame}
      question={snapshot.activeQuestion}
      answers={snapshot.activeGameAnswers}
      players={snapshot.players}
      missions={snapshot.missions}
    />
  );
}
