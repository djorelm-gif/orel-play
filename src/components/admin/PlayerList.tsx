'use client';

import { Avatar } from '@/components/ui/Avatar';
import type { Player } from '@/types/player';

export function PlayerList({ players }: { players: Player[] }) {
  return (
    <div className="space-y-2 max-h-72 overflow-auto scrollbar-fancy">
      {players.length === 0 && <div className="text-muted text-sm panel p-3">עדיין לא הצטרפו שחקנים</div>}
      {players.map((p) => (
        <div key={p.id} className="panel p-2 flex items-center gap-2">
          <Avatar name={p.display_name} photoUrl={p.photo_url} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{p.display_name}</div>
          </div>
          <div className="text-xs text-gold-light">{p.total_score}</div>
        </div>
      ))}
    </div>
  );
}
