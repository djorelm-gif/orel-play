'use client';

import { Avatar } from '@/components/ui/Avatar';
import type { Player } from '@/types/player';

export function PlayerList({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="panel p-6 text-center text-muted text-sm">
        עדיין לא הצטרפו שחקנים. סרקו את ה-QR ממסך ההצטרפות כדי לבדוק.
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-[60vh] overflow-auto scrollbar-fancy pr-1">
      {players.map((p, i) => (
        <div key={p.id} className="panel p-2.5 flex items-center gap-3">
          <div className="text-xs text-muted w-5 text-center">{i + 1}</div>
          <Avatar name={p.display_name} photoUrl={p.photo_url} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate flex items-center gap-1.5">
              <span>{p.display_name}</span>
              {p.gender === 'male' && <span className="text-xs opacity-60">👦</span>}
              {p.gender === 'female' && <span className="text-xs opacity-60">👧</span>}
            </div>
            <div className="text-xs text-muted flex items-center gap-2">
              <span>הצטרפ/ה {timeAgo(p.joined_at)}</span>
              {p.notifications_opt_in && <span title="התראות פעילות">🔔</span>}
            </div>
          </div>
          <div className="text-end">
            <div className="text-xs text-muted">נקודות</div>
            <div className="text-lg font-bold text-gold-light leading-tight">{p.total_score}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `לפני ${sec} שניות`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} ד׳`;
  const h = Math.floor(min / 60);
  return `לפני ${h} ש׳`;
}
