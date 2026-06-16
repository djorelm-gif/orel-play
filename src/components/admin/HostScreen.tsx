'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePolledResource } from '@/lib/realtime/hooks';
import { StagePreview } from './StagePreview';
import { StageStateButtons } from './StageStateButtons';
import { WheelControls } from './WheelControls';
import { GameBuilder } from './GameBuilder';
import { PlayerList } from './PlayerList';
import { BatMitzvahLinkCard } from './BatMitzvahLinkCard';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { Logo } from '@/components/ui/Logo';
import { getGameDefinition } from '@/lib/game-engine/registry';
import type { OrelEvent } from '@/types/event';
import type { Player } from '@/types/player';
import type { Greeting } from '@/types/greeting';
import type { EventGame, GameQuestion, PlayerAnswer, SecretMission } from '@/types/game';
import { STAGE_STATE_LABELS, type LiveSession } from '@/types/live-session';

interface AdminSnapshot {
  event: OrelEvent;
  liveSession: LiveSession;
  players: Player[];
  greetings: Greeting[];
  eventGames: EventGame[];
  activeQuestion: GameQuestion | null;
  activeAnswers: PlayerAnswer[];
  missions: SecretMission[];
}

// Single-screen admin: header + 3 columns that fill the viewport. Each column
// scrolls internally if its content overflows — the page itself never scrolls.
export function HostScreen({ initial }: { initial: AdminSnapshot }) {
  const { data, refresh } = usePolledResource<AdminSnapshot>(
    `/api/events/${initial.event.event_code}/admin-snapshot`,
    { initialValue: initial, intervalMs: 1200 },
  );
  const snap = data ?? initial;
  const live = snap.liveSession;
  const activeGame = snap.eventGames.find((g) => g.id === live.active_event_game_id);
  const activeGameQuestions = useMemo(
    () => (activeGame ? [snap.activeQuestion].filter(Boolean) : []),
    [activeGame, snap.activeQuestion],
  );
  const pendingCount = snap.greetings.filter(
    (g) => g.moderation_status === 'pending' || g.moderation_status === 'needs_review',
  ).length;
  const optedInCount = snap.players.filter((p) => p.wants_to_participate).length;

  // Right-column sub-tabs. Greetings opens automatically when something needs
  // moderating so the host doesn't miss a queue.
  const [rightTab, setRightTab] = useState<'greetings' | 'players' | 'builder' | 'wizard'>(
    pendingCount > 0 ? 'greetings' : 'players',
  );

  return (
    <div className="h-screen overflow-hidden p-3 flex flex-col gap-3 stage-vignette">
      <ThemeApplier eventType={snap.event.event_type} />

      {/* Header — slim, single row */}
      <header className="panel-strong p-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="text-sm leading-tight">
            <div className="text-muted">{snap.event.name}</div>
            <div>
              קוד:{' '}
              <span className="text-gold tracking-widest font-bold">{snap.event.event_code}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="chip">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span>שידור חי · {STAGE_STATE_LABELS[live.stage_state]}</span>
          </div>
          <div className="text-sm text-muted">
            שחקנים: <span className="text-gold-light font-bold">{snap.players.length}</span>
            {optedInCount > 0 && (
              <span className="text-gold-light"> · 🙋 {optedInCount}</span>
            )}
          </div>
          <a
            className="btn-gold py-2 px-3 text-sm"
            href={`/stage/${snap.event.event_code}`}
            target="_blank"
            rel="noreferrer"
          >
            פתח מסך הקרנה ↗
          </a>
        </div>
      </header>

      {/* Body: 3 columns, fill remaining height, each column scrolls if needed */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left: stage controls + wheel + active game host */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-fancy pr-1">
          <div className="panel-strong p-3 space-y-2 shrink-0">
            <div className="text-xs text-muted">מצב מסך</div>
            <StageStateButtons
              eventCode={snap.event.event_code}
              current={live.stage_state}
              onChanged={refresh}
            />
          </div>
          <div className="panel-strong p-3 space-y-2 shrink-0">
            <div className="text-xs text-muted">גלגל המזל</div>
            <WheelControls
              eventCode={snap.event.event_code}
              games={snap.eventGames}
              liveSession={live}
            />
          </div>
          {activeGame ? (
            <div className="panel-strong p-3 space-y-2 shrink-0">
              <div className="text-xs text-muted">
                משחק פעיל: <span className="text-gold-light font-bold">{activeGame.title}</span>
              </div>
              <ActiveGameHost
                event={snap.event}
                eventGame={activeGame}
                liveSession={live}
                questions={activeGameQuestions as GameQuestion[]}
                players={snap.players}
                answers={snap.activeAnswers}
                missions={snap.missions}
                refresh={refresh}
              />
            </div>
          ) : (
            <div className="panel p-3 text-xs text-muted text-center shrink-0">
              אין משחק פעיל. הפעל גלגל או בחר משחק ידנית למעלה.
            </div>
          )}
        </section>

        {/* Middle: stage preview */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
          <StagePreview eventCode={snap.event.event_code} liveSession={live} />
          <BatMitzvahLinkCard event={snap.event} />
        </section>

        {/* Right: greetings / players / builder / wizard tabs */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0">
          <nav className="panel p-1 flex gap-1 shrink-0">
            <RightTab active={rightTab === 'greetings'} onClick={() => setRightTab('greetings')}>
              ברכות{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </RightTab>
            <RightTab active={rightTab === 'players'} onClick={() => setRightTab('players')}>
              שחקנים ({snap.players.length})
            </RightTab>
            <RightTab active={rightTab === 'builder'} onClick={() => setRightTab('builder')}>
              משחקים
            </RightTab>
          </nav>
          <div className="panel-strong p-3 flex-1 min-h-0 overflow-y-auto scrollbar-fancy">
            {rightTab === 'greetings' && (
              <ModerationQueue greetings={snap.greetings} event={snap.event} onChange={refresh} />
            )}
            {rightTab === 'players' && <PlayerList players={snap.players} />}
            {rightTab === 'builder' && (
              <div className="space-y-2">
                <div className="text-xs text-muted">סמן/י אילו משחקים יופיעו בגלגל</div>
                <GameBuilder
                  eventCode={snap.event.event_code}
                  games={snap.eventGames}
                  onChange={refresh}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RightTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
        active ? 'bg-gold-gradient text-black' : 'text-muted hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}

function ActiveGameHost({
  event,
  eventGame,
  liveSession,
  questions,
  players,
  answers,
  missions,
  refresh,
}: {
  event: OrelEvent;
  eventGame: EventGame;
  liveSession: LiveSession;
  questions: GameQuestion[];
  players: Player[];
  answers: PlayerAnswer[];
  missions: SecretMission[];
  refresh: () => void;
}) {
  const def = getGameDefinition(eventGame.game_type);
  const Host = def.hostControls;
  // We need ALL questions for this game (not just the active one in the snapshot)
  // so the host can advance through them. Fetch on game change.
  const [fullQuestions, setFullQuestions] = useState<GameQuestion[]>(questions);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${event.event_code}/games/${eventGame.id}/questions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.questions) setFullQuestions(data.questions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [event.event_code, eventGame.id]);

  return (
    <Host
      event={event}
      eventGame={eventGame}
      liveSession={liveSession}
      questions={fullQuestions.length > 0 ? fullQuestions : questions}
      players={players}
      answers={answers}
      missions={missions}
      refresh={refresh}
    />
  );
}
