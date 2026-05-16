'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePolledResource } from '@/lib/realtime/hooks';
import { StageBackdrop } from '@/components/ui/StageBackdrop';
import { JoinScreen } from './JoinScreen';
import { GreetingsWall } from './GreetingsWall';
import { WheelStage } from './WheelStage';
import { Confetti } from '@/components/ui/Confetti';
import { MuteToggle } from '@/components/ui/MuteToggle';
import { FullscreenButton } from '@/components/ui/FullscreenButton';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { getGameDefinition } from '@/lib/game-engine/registry';
import { confirmWheelStop } from '@/lib/game-engine/host-actions';
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

interface Props {
  eventCode: string;
  joinUrl: string;
  initial: Snapshot;
}

export function StageScreen({ eventCode, joinUrl, initial }: Props) {
  const { data } = usePolledResource<Snapshot>(`/api/events/${eventCode}/snapshot`, { initialValue: initial });
  const snap = data ?? initial;
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

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-white">
      <ThemeApplier eventType={snap.event.event_type} />
      <StageBackdrop />

      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {state === 'JOIN_SCREEN' && (
            <JoinScreen event={snap.event} players={snap.players} joinUrl={joinUrl} />
          )}
          {state === 'GREETINGS_WALL' && (
            <GreetingsWall greetings={snap.approvedGreetings} childName={snap.event.child_name} />
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
              <div className="space-y-4">
                <h1 className="stage-headline font-display gold-shimmer">הפסקה קצרה</h1>
                <p className="stage-subheadline text-muted">תכף ממשיכים — הישארו איתנו</p>
              </div>
            </div>
          )}
          {state === 'FINAL_SCREEN' && (
            <div className="relative z-10 flex h-full items-center justify-center text-center">
              <div className="space-y-6">
                <div className="text-8xl">🎉</div>
                <h1 className="stage-headline font-display gold-shimmer">תודה שהייתם איתנו</h1>
                <p className="stage-subheadline text-muted">{snap.event.name}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Confetti trigger={confettiKey} />

      <div className="absolute bottom-4 start-6 text-xs text-muted/60 flex items-center gap-2 z-20">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        OREL PLAY · {snap.event.event_code}
        {state !== 'JOIN_SCREEN' && <span className="ms-2">· {state}</span>}
      </div>

      <div className="absolute bottom-4 end-6 z-20 flex items-center gap-2">
        <MuteToggle />
        <FullscreenButton />
      </div>
    </div>
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
