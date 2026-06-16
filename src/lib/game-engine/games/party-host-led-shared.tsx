'use client';

// Shared scaffold for "host-led" physical party games — 10 Boom, Grandma is
// Pregnant, What Didn't I Hear, One of These Days, Obstacle Course. There
// are no per-question rounds; the host runs the game out loud and uses the
// stage / phone screens as visual aids and pacing tools.

import { motion } from 'framer-motion';
import { patchLiveSession } from '@/lib/game-engine/host-actions';
import { haptic } from '@/lib/haptics';
import type { StageProps, PlayerProps, HostControlsProps } from '../types';

interface PartyConfig {
  emoji: string;
  title: string;
  tagline: string;
  // Numbered rules — shown big on stage.
  rules: string[];
  // What the audience sees on their phone while it runs.
  playerNote: string;
  // Optional bullet list shown to the host when running the game.
  hostNotes?: string[];
}

export function makePartyStage(cfg: PartyConfig) {
  return function Stage({ liveSession }: StageProps) {
    const intro = liveSession.stage_state === 'GAME_INTRO';
    const reveal = liveSession.stage_state === 'GAME_RESULTS';

    return (
      <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-12 py-10">
        <div className="col-span-7 flex flex-col justify-center gap-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="space-y-4"
          >
            <div className="text-7xl">{cfg.emoji}</div>
            <div className="chip">
              <span className="size-2 rounded-full bg-magenta animate-pulse" />
              <span className="tracking-[0.3em]">{intro ? 'המשחק שנבחר' : reveal ? 'סיום סיבוב' : 'משחק חי'}</span>
            </div>
            <h1 className="stage-headline font-display gold-shimmer leading-[0.95]">{cfg.title}</h1>
            <p className="stage-subheadline text-muted">{cfg.tagline}</p>
          </motion.div>
        </div>

        <div className="col-span-5 flex flex-col justify-center gap-3">
          <div className="text-xs text-muted tracking-[0.2em]">חוקי המשחק</div>
          <div className="panel-strong p-5 space-y-3">
            {cfg.rules.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 280, damping: 26 }}
                className="flex gap-3 items-start"
              >
                <div className="size-8 rounded-full bg-gold-gradient text-black font-display font-black grid place-items-center text-lg shrink-0">
                  {i + 1}
                </div>
                <div className="text-2xl leading-snug pt-0.5">{rule}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };
}

export function makePartyPlayer(cfg: PartyConfig) {
  return function PlayerCmp({ liveSession }: PlayerProps) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-6 text-center space-y-3 panel-strong">
          <div className="text-6xl">{cfg.emoji}</div>
          <div className="text-3xl font-display font-black gold-shimmer">{cfg.title}</div>
          <div className="text-muted text-base text-balance">{cfg.tagline}</div>
        </div>
        <div className="panel p-5 space-y-2 text-balance">
          <div className="text-xs text-muted tracking-[0.2em]">איך משחקים</div>
          {cfg.rules.map((rule, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="text-gold-light font-bold text-sm pt-0.5">{i + 1}.</div>
              <div className="text-base">{rule}</div>
            </div>
          ))}
        </div>
        <div className="panel p-4 text-center text-base text-muted">{cfg.playerNote}</div>
        {liveSession.stage_state === 'GAME_RESULTS' && (
          <div className="rounded-3xl p-5 text-center text-2xl font-bold panel-strong text-gold-light">
            🎉 כל הכבוד! המנחה מכריז/ה על הזוכים
          </div>
        )}
      </div>
    );
  };
}

export function makePartyHost(cfg: PartyConfig) {
  return function Host({ event, liveSession }: HostControlsProps) {
    async function run(patch: Record<string, unknown>) {
      haptic('light');
      await patchLiveSession(event.event_code, patch);
    }

    const stage = liveSession.stage_state;
    return (
      <div className="space-y-3">
        <div className="text-xs text-muted">{cfg.title}</div>
        {cfg.hostNotes && cfg.hostNotes.length > 0 && (
          <div className="panel p-3 text-xs text-muted space-y-1">
            <div className="text-gold-light font-bold mb-1">טיפים למנחה</div>
            {cfg.hostNotes.map((note, i) => (
              <div key={i}>• {note}</div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-gold"
            onClick={() => run({ stage_state: 'GAME_ACTIVE' })}
            disabled={stage === 'GAME_ACTIVE'}
          >
            התחל סיבוב ▶
          </button>
          <button
            className="btn-magenta"
            onClick={() => run({ stage_state: 'GAME_RESULTS' })}
            disabled={stage === 'GAME_RESULTS'}
          >
            סיים והכריז על המנצח/ת
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => run({ stage_state: 'GAME_INTRO' })}>
            חזור לפתיח
          </button>
          <button
            className="btn-ghost"
            onClick={() =>
              run({ stage_state: 'BREAK_SCREEN', active_event_game_id: null, active_question_id: null })
            }
          >
            סיים משחק
          </button>
        </div>
      </div>
    );
  };
}
