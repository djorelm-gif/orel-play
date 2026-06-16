'use client';

// Shared scaffold for "host-led" physical party games — 10 Boom, Grandma is
// Pregnant, What Didn't I Hear, One of These Days, Obstacle Course. There
// are no per-question rounds; the host runs the game out loud and uses the
// stage / phone screens as visual aids and pacing tools.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { patchLiveSession } from '@/lib/game-engine/host-actions';
import { haptic } from '@/lib/haptics';
import { CrownIcon } from '@/components/ui/icons/GoldIcon';
import { Avatar } from '@/components/ui/Avatar';
import type { EventType } from '@/types/event';
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

// Gender-aware winner title — feminine for bat mitzvah, masculine for bar.
function winnerLabel(eventType: EventType): string {
  return eventType === 'bat_mitzvah' ? 'המנצחת' : 'המנצח';
}

interface PartyPayload {
  winner_name?: string;
  // Names of the volunteers the host drew for this round. Stored as display
  // names (not ids) because party-game volunteers are often non-app guests
  // for musical_chairs and real players for the rest — using names lets us
  // render either consistently.
  selected_player_names?: string[];
}

export function makePartyStage(cfg: PartyConfig) {
  return function Stage({ event, liveSession, players }: StageProps) {
    const intro = liveSession.stage_state === 'GAME_INTRO';
    const reveal = liveSession.stage_state === 'GAME_RESULTS';
    const active = liveSession.stage_state === 'GAME_ACTIVE';
    const payload = (liveSession.current_payload ?? {}) as PartyPayload;
    const winnerName = payload.winner_name?.trim();
    const volunteerNames = (payload.selected_player_names ?? []).filter((n) => n && n.trim().length > 0);
    const showVolunteers = active && volunteerNames.length > 0;

    // Winner reveal: dominates the stage when the host has declared someone.
    if (reveal && winnerName) {
      return (
        <div className="relative z-10 flex h-full items-center justify-center px-12">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 230, damping: 16, delay: 0.18 }}
              className="flex justify-center"
            >
              <CrownIcon size={120} />
            </motion.div>
            <div
              className="font-editorial font-black text-gold-light tracking-wide"
              style={{ fontSize: 'clamp(40px, 5vw, 80px)' }}
            >
              {winnerLabel(event.event_type)}
            </div>
            <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent opacity-90" />
            <div
              className="font-editorial font-black gold-shimmer leading-none"
              style={{ fontSize: 'clamp(80px, 12vw, 200px)', letterSpacing: '-0.02em' }}
            >
              {winnerName}
            </div>
            <div className="stage-subheadline text-muted">כל הכבוד!</div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-12 py-10">
        <div className="col-span-7 flex flex-col justify-center gap-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="space-y-4"
          >
            <div className="text-7xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]">{cfg.emoji}</div>
            <div className="chip">
              <span className="size-2 rounded-full bg-magenta animate-pulse" />
              <span className="tracking-[0.3em]">{intro ? 'המשחק שנבחר' : reveal ? 'סיום סיבוב' : 'משחק חי'}</span>
            </div>
            <h1 className="stage-headline-editorial font-editorial gold-shimmer leading-[0.95]">
              {cfg.title}
            </h1>
            {/* Hairline gold separator between title and tagline — keynote feel. */}
            <div className="h-px w-28 bg-gradient-to-l from-transparent via-gold to-transparent opacity-90 me-auto" />
            <p className="stage-subheadline text-muted">{cfg.tagline}</p>
          </motion.div>
        </div>

        {/* Right column: rules normally, swapped to the volunteers panel once
            the host has drawn names so the audience knows who's up. */}
        <div className="col-span-5 flex flex-col justify-center gap-3">
          {showVolunteers ? (
            <>
              <div className="text-xs text-muted tracking-[0.3em]">המתנדבים</div>
              <div className="panel-3d p-6 space-y-3">
                {volunteerNames.map((name, i) => {
                  const player = players.find((p) => p.display_name === name);
                  return (
                    <motion.div
                      key={`${name}-${i}`}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.08, type: 'spring', stiffness: 280, damping: 26 }}
                      className="flex gap-4 items-center"
                    >
                      <Avatar name={name} photoUrl={player?.photo_url ?? null} size="lg" />
                      <div className="text-3xl font-editorial font-black text-gold-light leading-tight">
                        {name}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted tracking-[0.3em]">חוקי המשחק</div>
              <div className="panel-3d p-6 space-y-4">
                {cfg.rules.map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.09, type: 'spring', stiffness: 280, damping: 26 }}
                    className="flex gap-4 items-start"
                  >
                    <div
                      className="size-10 rounded-full text-black font-editorial font-black grid place-items-center text-xl shrink-0"
                      style={{
                        background:
                          'radial-gradient(circle at 35% 25%, #fff7dc 0%, #ffe7a3 25%, #d8a84e 65%, #9c7732 100%)',
                        boxShadow:
                          '0 0 0 1px rgba(255,231,163,0.6), 0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.85), inset 0 -3px 6px rgba(120,75,20,0.55)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-2xl leading-snug pt-1">{rule}</div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
}

export function makePartyPlayer(cfg: PartyConfig) {
  return function PlayerCmp({ event, liveSession, player }: PlayerProps) {
    const payload = (liveSession.current_payload ?? {}) as PartyPayload;
    const winnerName = payload.winner_name?.trim();
    const isResults = liveSession.stage_state === 'GAME_RESULTS';
    const isActive = liveSession.stage_state === 'GAME_ACTIVE';
    const volunteerNames = payload.selected_player_names ?? [];
    // Match on display_name — see comment on PartyPayload for why.
    const iAmChosen = isActive && volunteerNames.includes(player.display_name);

    // Buzz + small visual pulse the moment we land on the list.
    const wasChosen = useRef(false);
    useEffect(() => {
      if (iAmChosen && !wasChosen.current) {
        wasChosen.current = true;
        haptic('heavy');
      }
      if (!iAmChosen) wasChosen.current = false;
    }, [iAmChosen]);

    if (iAmChosen) {
      return (
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="rounded-3xl p-6 text-center space-y-3 bg-gold-gradient text-black shadow-gold-glow"
          >
            <div className="text-6xl">🎯</div>
            <div className="text-3xl font-display font-black">קיבלת תור!</div>
            <div className="text-lg font-bold">עלה/י לבמה</div>
          </motion.div>
          <ConfettiBurst />
          <div className="panel p-4 text-center text-base text-muted">{cfg.tagline}</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-6 text-center space-y-3 panel-strong">
          <div className="text-6xl">{cfg.emoji}</div>
          <div className="text-3xl font-display font-black gold-shimmer">{cfg.title}</div>
          <div className="text-muted text-base text-balance">{cfg.tagline}</div>
        </div>
        {volunteerNames.length > 0 && isActive && (
          <div className="panel p-4 space-y-1 text-center">
            <div className="text-xs text-muted tracking-[0.2em]">המתנדבים שעלו לבמה</div>
            <div className="text-base text-gold-light font-bold">
              {volunteerNames.join(' · ')}
            </div>
          </div>
        )}
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
        {isResults && (
          <div className="rounded-3xl p-5 text-center text-2xl font-bold panel-strong text-gold-light">
            {winnerName ? `👑 ${winnerLabel(event.event_type)}: ${winnerName}` : '🎉 כל הכבוד! המנחה מכריז/ה על הזוכים'}
          </div>
        )}
      </div>
    );
  };
}

// Tiny one-shot confetti burst for the player card. CSS-only — we don't want
// to pull a fresh dependency in for a brief flourish on the phone.
function ConfettiBurst() {
  const pieces = Array.from({ length: 14 });
  return (
    <div className="relative h-6">
      {pieces.map((_, i) => {
        const left = (i / pieces.length) * 100 + (Math.random() * 6 - 3);
        const delay = Math.random() * 0.15;
        const palette = ['#FFE7A3', '#D8A84E', 'rgb(var(--accent-rgb))'];
        const color = palette[i % palette.length];
        return (
          <motion.span
            key={i}
            initial={{ y: -10, opacity: 0, rotate: 0 }}
            animate={{ y: 70, opacity: [0, 1, 0], rotate: 240 }}
            transition={{ duration: 1.4, delay, ease: 'easeOut' }}
            className="absolute top-0 size-2 rounded-sm"
            style={{ left: `${left}%`, background: color }}
          />
        );
      })}
    </div>
  );
}

export function makePartyHost(cfg: PartyConfig) {
  return function Host({ event, liveSession, players }: HostControlsProps) {
    const payload = (liveSession.current_payload ?? {}) as PartyPayload;
    const [winnerName, setWinnerName] = useState<string>(payload.winner_name ?? '');
    const [randomN, setRandomN] = useState(4);

    async function run(patch: Record<string, unknown>) {
      haptic('light');
      await patchLiveSession(event.event_code, patch);
    }

    // Declare a winner and flip the stage to results. Free-text wins over the
    // dropdown choice — physical-game winners are often guests who aren't even
    // logged into the app.
    async function declareWinner() {
      const trimmed = winnerName.trim();
      if (!trimmed) return;
      haptic('medium');
      await patchLiveSession(event.event_code, {
        stage_state: 'GAME_RESULTS',
        current_payload: { ...payload, winner_name: trimmed },
      });
    }

    const stage = liveSession.stage_state;
    const activePlayers = players.filter((p) => p.status === 'active' && !p.is_child_star);
    const optedIn = activePlayers.filter((p) => p.wants_to_participate);
    const volunteerNames = payload.selected_player_names ?? [];

    // Draw N volunteers from the opt-in pool. If nobody volunteered we draw
    // from all active players so the host isn't stuck waiting for taps.
    function drawVolunteers() {
      const pool = optedIn.length > 0 ? optedIn : activePlayers;
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const names = shuffled.slice(0, Math.min(randomN, shuffled.length)).map((p) => p.display_name);
      haptic('medium');
      patchLiveSession(event.event_code, {
        stage_state: 'GAME_ACTIVE',
        current_payload: { ...payload, selected_player_names: names },
      });
    }

    function clearVolunteers() {
      const { selected_player_names: _drop, ...rest } = payload;
      void _drop;
      patchLiveSession(event.event_code, {
        current_payload: rest,
      });
    }

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

        <div className="panel p-3 space-y-2">
          <div className="text-xs text-muted">
            התנדבו למשחק: <span className="text-gold-light font-bold">{optedIn.length}</span>
            {optedIn.length === 0 && ' · אף אחד לא לחץ "להשתתף" עדיין — נגריל מכולם'}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">מס׳ מתנדבים</label>
            <input
              type="number"
              min={1}
              max={20}
              value={randomN}
              onChange={(e) => setRandomN(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-16 rounded-lg bg-white/8 border border-white/15 px-2 py-1 text-center"
            />
            <button className="btn-gold flex-1 text-sm py-2" onClick={drawVolunteers}>
              🎲 הגרל {randomN} מהמתנדבים
            </button>
          </div>
          {volunteerNames.length > 0 && (
            <div className="text-xs text-gold-light text-end flex items-center gap-2 justify-end">
              <span>נבחרו: {volunteerNames.join(' · ')}</span>
              <button className="text-muted underline decoration-dotted" onClick={clearVolunteers}>
                נקה
              </button>
            </div>
          )}
        </div>

        <div className="panel p-3 space-y-2">
          <div className="text-xs text-muted">{`שם ${winnerLabel(event.event_type)}`}</div>
          <input
            type="text"
            value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
            placeholder="הקלד/י שם, או בחר/י מהרשימה"
            className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-end"
          />
          {activePlayers.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setWinnerName(e.target.value);
              }}
              className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-end"
            >
              <option value="">— בחר/י מבין השחקנים —</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.display_name}>
                  {p.display_name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn-gold w-full"
            onClick={declareWinner}
            disabled={!winnerName.trim()}
          >
            👑 הכרז על {winnerName.trim() || 'מנצח/ת'}
          </button>
        </div>

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
