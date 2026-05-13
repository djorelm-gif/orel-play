'use client';

import { toggleGame } from '@/lib/game-engine/host-actions';
import { GAME_TITLES, GAME_DESCRIPTIONS } from '@/types/game';
import type { EventGame } from '@/types/game';
import { getGameDefinition } from '@/lib/game-engine/registry';

export function GameBuilder({ eventCode, games, onChange }: { eventCode: string; games: EventGame[]; onChange?: () => void }) {
  return (
    <div className="space-y-2">
      {games.map((g) => {
        const def = getGameDefinition(g.game_type);
        return (
          <div key={g.id} className="panel p-3 flex items-center gap-3">
            <div className="text-3xl">{def.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{GAME_TITLES[g.game_type]}</div>
              <div className="text-xs text-muted truncate">{GAME_DESCRIPTIONS[g.game_type]}</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await toggleGame(eventCode, g.id, { is_enabled: !g.is_enabled });
                onChange?.();
              }}
              role="switch"
              aria-checked={g.is_enabled}
              aria-label={g.is_enabled ? 'מופעל' : 'כבוי'}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                g.is_enabled ? 'bg-gold shadow-gold-glow' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${
                  g.is_enabled ? 'right-1' : 'right-7'
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
