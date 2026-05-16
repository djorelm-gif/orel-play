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
  const [tab, setTab] = useState<'controls' | 'moderation' | 'builder' | 'players'>('controls');

  return (
    <div className="min-h-screen p-4 grid grid-cols-12 gap-4 stage-vignette">
      <ThemeApplier eventType={snap.event.event_type} />
      {/* Top bar */}
      <header className="col-span-12 panel-strong p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="text-sm">
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
          <div className="text-sm text-muted">שחקנים: <span className="text-gold-light font-bold">{snap.players.length}</span></div>
          <a className="btn-gold py-2 px-3 text-sm" href={`/stage/${snap.event.event_code}`} target="_blank" rel="noreferrer">
            פתח מסך הקרנה ↗
          </a>
        </div>
      </header>

      {/* Left: controls */}
      <section className="col-span-12 lg:col-span-5 space-y-4">
        <nav className="panel p-1 flex gap-1">
          {(['controls', 'moderation', 'builder', 'players'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t ? 'bg-gold-gradient text-black' : 'text-muted hover:bg-white/5'
              }`}
            >
              {t === 'controls' && 'שליטה'}
              {t === 'moderation' && `ברכות${countPending(snap.greetings)}`}
              {t === 'builder' && 'משחקים'}
              {t === 'players' && `שחקנים (${snap.players.length})`}
            </button>
          ))}
        </nav>

        {tab === 'controls' && (
          <div className="space-y-4">
            <div className="panel-strong p-4 space-y-3">
              <div className="text-sm text-muted">מצב מסך</div>
              <StageStateButtons eventCode={snap.event.event_code} current={live.stage_state} />
            </div>
            <div className="panel-strong p-4 space-y-3">
              <div className="text-sm text-muted">גלגל המזל</div>
              <WheelControls eventCode={snap.event.event_code} games={snap.eventGames} liveSession={live} />
            </div>
            {activeGame && (
              <div className="panel-strong p-4 space-y-3">
                <div className="text-sm text-muted">
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
            )}
          </div>
        )}

        {tab === 'moderation' && (
          <div className="panel-strong p-4">
            <ModerationQueue greetings={snap.greetings} onChange={refresh} />
          </div>
        )}

        {tab === 'builder' && (
          <div className="panel-strong p-4 space-y-2">
            <div className="text-sm text-muted">סמן/י אילו משחקים יופיעו בגלגל</div>
            <GameBuilder eventCode={snap.event.event_code} games={snap.eventGames} onChange={refresh} />
          </div>
        )}

        {tab === 'players' && (
          <div className="panel-strong p-4 space-y-2">
            <PlayerList players={snap.players} />
          </div>
        )}
      </section>

      {/* Right: stage preview + quick info */}
      <section className="col-span-12 lg:col-span-7 space-y-4">
        <StagePreview eventCode={snap.event.event_code} />

        <BatMitzvahLinkCard event={snap.event} />

        <div className="grid grid-cols-2 gap-3">
          <div className="panel-strong p-4">
            <div className="text-xs text-muted mb-2">לינק הצטרפות</div>
            <div className="text-sm">
              <code className="bg-black/50 px-2 py-1 rounded">/join/{snap.event.event_code}</code>
            </div>
          </div>
          <div className="panel-strong p-4">
            <div className="text-xs text-muted mb-2">ברכות ממתינות</div>
            <div className="text-3xl font-display text-gold-light font-bold">
              {snap.greetings.filter((g) => g.moderation_status === 'pending' || g.moderation_status === 'needs_review').length}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function countPending(greetings: Greeting[]): string {
  const c = greetings.filter((g) => g.moderation_status === 'pending' || g.moderation_status === 'needs_review').length;
  return c > 0 ? ` (${c})` : '';
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
