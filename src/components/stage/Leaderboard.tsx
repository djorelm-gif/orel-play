'use client';

import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { CrownIcon } from '@/components/ui/icons/GoldIcon';
import type { Player } from '@/types/player';
import type { EventType } from '@/types/event';

interface LeaderboardProps {
  players: Player[];
  eventType: EventType;
}

// Returns the gender-aware winner title — feminine for bat mitzvah, masculine for bar.
function winnerLabel(eventType: EventType): string {
  return eventType === 'bat_mitzvah' ? 'המנצחת' : 'המנצח';
}

const PLACE_LABELS = ['', '', 'מקום שני', 'מקום שלישי', 'מקום רביעי', 'מקום חמישי'];

export function Leaderboard({ players, eventType }: LeaderboardProps) {
  // Filter out the child star + kicked players, sort by score desc, take top 5.
  const ranked = players
    .filter((p) => p.status !== 'kicked' && !p.is_child_star)
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 5);

  if (ranked.length === 0) {
    return null;
  }

  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  const fourth = ranked[3];
  const fifth = ranked[4];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* #1 — panel-3d luxury card with the gold filigree crown emblem. */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        className="panel-3d p-8 flex flex-col items-center text-center gap-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.35 }}
        >
          <CrownIcon size={72} />
        </motion.div>
        <div className="chip">
          <span className="size-2 rounded-full bg-gold animate-pulse" />
          <span className="tracking-[0.3em]">{winnerLabel(eventType)}</span>
        </div>
        <Avatar name={first.display_name} photoUrl={first.photo_url} size="xl" />
        <div className="font-editorial font-black gold-shimmer text-6xl leading-none">
          {first.display_name}
        </div>
        <div className="text-2xl font-bold text-gold-light">{first.total_score} נקודות</div>
      </motion.div>

      {/* #2 and #3 — silver / bronze podium */}
      {(second || third) && (
        <div className="grid grid-cols-2 gap-4">
          {second && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.25 }}
              className="panel-strong p-5 flex flex-col items-center text-center gap-3"
            >
              <div className="text-3xl leading-none" aria-hidden>
                🥈
              </div>
              <div className="text-xs tracking-[0.3em] text-muted">{PLACE_LABELS[2]}</div>
              <Avatar name={second.display_name} photoUrl={second.photo_url} size="lg" />
              <div className="font-display font-black text-3xl text-white">
                {second.display_name}
              </div>
              <div className="text-lg font-bold text-muted">{second.total_score} נקודות</div>
            </motion.div>
          )}
          {third && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.35 }}
              className="panel-strong p-5 flex flex-col items-center text-center gap-3"
            >
              <div className="text-3xl leading-none" aria-hidden>
                🥉
              </div>
              <div className="text-xs tracking-[0.3em] text-muted">{PLACE_LABELS[3]}</div>
              <Avatar name={third.display_name} photoUrl={third.photo_url} size="lg" />
              <div className="font-display font-black text-3xl text-white">
                {third.display_name}
              </div>
              <div className="text-lg font-bold text-muted">{third.total_score} נקודות</div>
            </motion.div>
          )}
        </div>
      )}

      {/* #4 and #5 — panel cards */}
      {(fourth || fifth) && (
        <div className="grid grid-cols-2 gap-3">
          {fourth && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.45 }}
              className="panel p-4 flex items-center gap-3"
            >
              <Avatar name={fourth.display_name} photoUrl={fourth.photo_url} size="md" />
              <div className="flex-1 text-end">
                <div className="text-xs text-muted">{PLACE_LABELS[4]}</div>
                <div className="font-bold text-lg text-white">{fourth.display_name}</div>
              </div>
              <div className="text-base font-bold text-gold-light">{fourth.total_score}</div>
            </motion.div>
          )}
          {fifth && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.55 }}
              className="panel p-4 flex items-center gap-3"
            >
              <Avatar name={fifth.display_name} photoUrl={fifth.photo_url} size="md" />
              <div className="flex-1 text-end">
                <div className="text-xs text-muted">{PLACE_LABELS[5]}</div>
                <div className="font-bold text-lg text-white">{fifth.display_name}</div>
              </div>
              <div className="text-base font-bold text-gold-light">{fifth.total_score}</div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
