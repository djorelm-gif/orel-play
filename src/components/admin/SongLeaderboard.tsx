'use client';

import { usePolledResource } from '@/lib/realtime/hooks';
import type { OrelEvent } from '@/types/event';

interface RankedSong {
  norm_key: string;
  song_title: string;
  artist: string | null;
  youtube_video_id: string | null;
  youtube_url: string | null;
  picks: number;
}

interface SongsResponse {
  songs: RankedSong[];
  total: number;
}

// Admin view: live-ranked guest song picks. Polls every 4s — these change
// slower than scores so we don't need 1.2s like the main snapshot.
export function SongLeaderboard({ event }: { event: OrelEvent }) {
  const { data } = usePolledResource<SongsResponse>(
    `/api/events/${event.event_code}/songs?limit=30`,
    { intervalMs: 4000, initialValue: { songs: [], total: 0 } },
  );
  const songs = data?.songs ?? [];
  const total = data?.total ?? 0;

  if (songs.length === 0) {
    return (
      <div className="text-center text-sm text-muted py-8 space-y-2">
        <div className="text-3xl">🎵</div>
        <div>עוד לא הוצעו שירים — תזכיר/י לאורחים מהאשף שזה אופציה במסך השחקן.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted text-end">
        סך הכל בחירות: <span className="text-gold-light font-bold">{total}</span>
      </div>
      <ol className="space-y-1.5">
        {songs.map((s, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          return (
            <li
              key={s.norm_key}
              className={`flex items-center gap-2 rounded-xl p-2 ${
                isTop3 ? 'panel-strong shadow-gold-glow/30' : 'panel'
              }`}
            >
              <div
                className={`shrink-0 w-9 text-center text-sm font-black ${
                  isTop3 ? 'gold-shimmer' : 'text-muted'
                }`}
              >
                #{rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight truncate font-bold">{s.song_title}</div>
                {s.artist && (
                  <div className="text-[11px] text-muted leading-tight truncate">{s.artist}</div>
                )}
              </div>
              {s.youtube_url ? (
                <a
                  href={s.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-red-400 hover:text-red-300 whitespace-nowrap"
                >
                  ▶ פתח ביוטיוב
                </a>
              ) : (
                <span className="text-[10px] text-muted/60 whitespace-nowrap">אין קישור</span>
              )}
              <div
                className={`shrink-0 text-end min-w-[44px] text-xl font-black ${
                  isTop3 ? 'gold-shimmer' : 'text-gold-light'
                }`}
              >
                {s.picks}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
