'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import type { Greeting } from '@/types/greeting';
import type { Player } from '@/types/player';

interface Props {
  greetings: Greeting[];
  players: Player[];
  childName: string;
}

const SLIDE_MS = 4000;

// Looping slideshow of approved greetings shown on the final screen. Each
// slide cross-fades into the next with a soft 1.2s opacity fade and uses an
// editorial serif for the message so it reads like a printed program.
export function EndSlideshow({ greetings, players, childName }: Props) {
  const ordered = [...greetings].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (ordered.length === 0) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % ordered.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [ordered.length]);

  if (ordered.length === 0) {
    return (
      <div className="panel-strong rounded-3xl p-12 text-center text-2xl text-muted">
        עוד אין ברכות מאושרות — אבל תודה ש{childName} זכה/תה לכולכם.
      </div>
    );
  }

  const current = ordered[idx % ordered.length];
  const matchedPlayer =
    (current.player_id ? players.find((p) => p.id === current.player_id) : undefined) ??
    players.find((p) => p.display_name === current.display_name);
  const photo = current.photo_url ?? matchedPlayer?.photo_url ?? null;

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden rounded-3xl panel-strong">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-12 py-10 text-center"
        >
          {/* Soft gold halo behind the avatar — keynote portrait feel. */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,231,163,0.55) 0%, rgba(216,168,78,0.25) 45%, transparent 75%)',
                transform: 'scale(1.7)',
              }}
            />
            <div className="relative">
              <Avatar
                name={current.display_name}
                photoUrl={photo}
                size="xl"
                className="!size-40 !text-6xl ring-4 ring-gold/60"
              />
            </div>
          </div>
          <div
            className="font-editorial font-black gold-shimmer leading-none"
            style={{ fontSize: 'clamp(40px, 5vw, 76px)', letterSpacing: '-0.01em' }}
          >
            {current.display_name}
          </div>
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
          <p
            className="font-editorial text-balance max-w-3xl text-white/90 leading-snug"
            style={{ fontSize: 'clamp(22px, 2.4vw, 38px)' }}
          >
            {current.message}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tiny progress dots so the audience can sense the rhythm. */}
      {ordered.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {ordered.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full transition-all ${
                i === idx % ordered.length ? 'bg-gold-light w-4' : 'bg-white/25'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
