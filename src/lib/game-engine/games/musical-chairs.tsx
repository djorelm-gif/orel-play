'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { patchLiveSession } from '@/lib/game-engine/host-actions';
import type { GameDefinition, StageProps, PlayerProps, HostControlsProps } from '../types';
import { GAME_SPECS } from '../specs';

interface ChairsPayload {
  music_playing?: boolean;
  selected_player_ids?: string[];
  eliminated_player_ids?: string[];
  round?: number;
  winner_player_id?: string;
}

function Stage({ liveSession, players }: StageProps) {
  const payload = liveSession.current_payload as ChairsPayload;
  const music = payload.music_playing ?? false;
  const selected = (payload.selected_player_ids ?? []).map((id) => players.find((p) => p.id === id)!).filter(Boolean);
  const eliminated = new Set(payload.eliminated_player_ids ?? []);
  const round = payload.round ?? 1;
  const winner = payload.winner_player_id ? players.find((p) => p.id === payload.winner_player_id) : null;
  const intro = liveSession.stage_state === 'GAME_INTRO';

  if (intro) {
    return (
      <div className="relative z-10 flex h-full items-center justify-center px-12">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
          <div className="text-8xl">🪑</div>
          <h1 className="stage-headline font-display gold-shimmer">משחק הכיסאות</h1>
          <div className="text-2xl text-muted">המוזיקה רוצה לרקוד</div>
        </motion.div>
      </div>
    );
  }

  if (winner) {
    return (
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center space-y-8">
        <div className="text-6xl">👑</div>
        <h1 className="font-display font-black text-6xl gold-shimmer">המנצח/ת</h1>
        <div className="flex items-center gap-6">
          <Avatar name={winner.display_name} photoUrl={winner.photo_url} size="xl" />
          <div className="text-7xl font-display font-black text-gold-light">{winner.display_name}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-14 py-10">
      <div className="col-span-7 flex flex-col justify-center gap-6">
        <div className="space-y-2">
          <div className="chip">
            <span className="size-2 rounded-full bg-magenta animate-pulse" />
            <span className="tracking-[0.3em]">משחק הכיסאות · סיבוב {round}</span>
          </div>
          <motion.h1
            key={music ? 'play' : 'stop'}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display font-black"
            style={{ fontSize: 'clamp(48px, 7vw, 132px)' }}
          >
            {music ? '🎵 המוזיקה מתחילה…' : '🛑 שבו עכשיו!'}
          </motion.h1>
          <p className="stage-subheadline text-muted">{music ? 'תרקדו, תזוזו, תתפסו כיסא כשהמוזיקה עוצרת' : 'מי שנשאר עומד — מודח'}</p>
        </div>
      </div>
      <div className="col-span-5 panel p-6 self-center">
        <div className="text-sm text-muted mb-2">משתתפים</div>
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {selected.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: eliminated.has(p.id) ? 0.35 : 1 }}
                className="flex items-center gap-3"
              >
                <Avatar name={p.display_name} photoUrl={p.photo_url} size="md" />
                <span className={`text-xl font-bold ${eliminated.has(p.id) ? 'line-through text-muted' : 'text-white'}`}>
                  {p.display_name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PlayerCmp({ player, liveSession }: PlayerProps) {
  const payload = liveSession.current_payload as ChairsPayload;
  const isSelected = (payload.selected_player_ids ?? []).includes(player.id);
  const isEliminated = (payload.eliminated_player_ids ?? []).includes(player.id);
  const isWinner = payload.winner_player_id === player.id;

  if (isWinner) {
    return (
      <div className="rounded-3xl p-6 text-black bg-gold-gradient shadow-gold-glow text-center space-y-2">
        <div className="text-6xl">👑</div>
        <div className="text-3xl font-display font-black">ניצחת!</div>
        <div className="text-lg">+500 נקודות</div>
      </div>
    );
  }
  if (isEliminated) {
    return <div className="panel p-6 text-center text-2xl">הודחת. תודה שהשתתפת! 🎉</div>;
  }
  if (isSelected) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-6 text-black bg-gold-gradient shadow-gold-glow text-center space-y-2">
          <div className="text-5xl">🪑</div>
          <div className="text-2xl font-display font-black">את/ה במשחק!</div>
          <div className="text-lg">תזוז/י סביב הכיסאות. כשהמוזיקה עוצרת — שב/י!</div>
        </div>
        <div className="panel p-4 text-center text-xl">
          {payload.music_playing ? '🎵 רוקדים…' : '🛑 שבו!'}
        </div>
      </div>
    );
  }
  return (
    <div className="panel p-6 text-center space-y-2">
      <div className="text-4xl">👀</div>
      <div className="text-xl">צפו במסך הגדול — המנצח/ת ייקבע באולם</div>
    </div>
  );
}

function Host({ event, liveSession, players }: HostControlsProps) {
  const payload = (liveSession.current_payload as ChairsPayload) ?? {};
  const selected = payload.selected_player_ids ?? [];
  const eliminated = new Set(payload.eliminated_player_ids ?? []);
  const round = payload.round ?? 1;
  const [randomN, setRandomN] = useState(4);

  const update = (patch: ChairsPayload) =>
    patchLiveSession(event.event_code, {
      stage_state: 'GAME_ACTIVE',
      current_payload: { ...payload, ...patch },
    });

  const togglePlayer = (playerId: string) => {
    const next = selected.includes(playerId) ? selected.filter((id) => id !== playerId) : [...selected, playerId];
    update({ selected_player_ids: next });
  };

  const remainSelected = selected.filter((id) => !eliminated.has(id));
  const optedIn = players.filter((p) => p.status === 'active' && p.wants_to_participate);

  const pickRandom = () => {
    // Fisher-Yates shuffle then take N. Fall back to whole roster if no one
    // has opted in yet so the host isn't stuck.
    const pool = optedIn.length > 0 ? optedIn : players.filter((p) => p.status === 'active');
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const ids = shuffled.slice(0, Math.min(randomN, shuffled.length)).map((p) => p.id);
    update({ selected_player_ids: ids, eliminated_player_ids: [], round: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 space-y-2">
        <div className="text-xs text-muted">
          התנדבו למשחק: <span className="text-gold-light font-bold">{optedIn.length}</span>
          {optedIn.length === 0 && ' · אף אחד לא לחץ "להשתתף" עדיין — נגריל מכולם'}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">מס׳ משתתפים</label>
          <input
            type="number"
            min={2}
            max={20}
            value={randomN}
            onChange={(e) => setRandomN(Math.max(2, Math.min(20, Number(e.target.value) || 2)))}
            className="w-16 rounded-lg bg-white/8 border border-white/15 px-2 py-1 text-center"
          />
          <button className="btn-gold flex-1 text-sm py-2" onClick={pickRandom}>
            🎲 הגרל {randomN} משתתפים
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted">או בחרו ידנית</div>
        <div className="max-h-44 overflow-auto scrollbar-fancy space-y-1">
          {players.length === 0 && <div className="text-muted text-sm">אין שחקנים מחוברים</div>}
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`w-full text-end px-3 py-2 rounded-lg flex items-center gap-2 ${
                selected.includes(p.id) ? 'bg-gold/20 border border-gold/60' : 'bg-white/5 border border-white/10'
              }`}
            >
              <Avatar name={p.display_name} photoUrl={p.photo_url} size="sm" />
              <span className="flex-1 text-end">{p.display_name}</span>
              {p.wants_to_participate && <span className="text-gold-light text-xs">🙋 רוצה</span>}
              {eliminated.has(p.id) && <span className="text-danger text-xs">הודח</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-gold" onClick={() => update({ music_playing: true, round })}>
          🎵 התחל מוזיקה
        </button>
        <button className="btn-magenta" onClick={() => update({ music_playing: false, round })}>
          🛑 עצור מוזיקה
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted">סמן/י מודח/ים</div>
        <div className="max-h-24 overflow-auto space-y-1">
          {remainSelected.map((id) => {
            const p = players.find((x) => x.id === id);
            if (!p) return null;
            return (
              <button
                key={id}
                onClick={() => update({ eliminated_player_ids: [...(payload.eliminated_player_ids ?? []), id] })}
                className="w-full px-3 py-2 rounded-lg bg-danger/10 border border-danger/50 text-danger flex items-center gap-2"
              >
                <Avatar name={p.display_name} photoUrl={p.photo_url} size="sm" />
                <span>הדח {p.display_name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-ghost" onClick={() => update({ round: round + 1, music_playing: false })}>
          סיבוב הבא
        </button>
        <button
          className="btn-gold-outline"
          disabled={remainSelected.length !== 1}
          onClick={() =>
            patchLiveSession(event.event_code, {
              stage_state: 'GAME_RESULTS',
              current_payload: { ...payload, winner_player_id: remainSelected[0] },
            })
          }
        >
          הכרז מנצח 👑
        </button>
      </div>
    </div>
  );
}

export const musicalChairs: GameDefinition = {
  type: 'musical_chairs',
  title: 'משחק הכיסאות',
  description: 'הגרסה הדיגיטלית למשחק הכיסאות',
  emoji: '🪑',
  defaultConfig: {},
  aiSpec: GAME_SPECS.musical_chairs,
  stage: Stage,
  player: PlayerCmp,
  hostControls: Host,
};
