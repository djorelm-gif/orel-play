'use client';

import { useCallback, useEffect, useState } from 'react';
import { haptic } from '@/lib/haptics';
import type { Player } from '@/types/player';

interface MyPick {
  id: string;
  song_title: string;
  artist: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  created_at: string;
}

// Inline song-picker shown to guests on idle stage states. The host's DJ uses
// the aggregated leaderboard on the admin screen — we keep this UI minimal so
// it never competes with active games.
export function SongPicker({ eventCode, token, me }: { eventCode: string; token: string; me: Player }) {
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [picks, setPicks] = useState<MyPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err' | 'dup'; text: string } | null>(null);

  const isF = me.gender === 'female';
  const addLabel = isF ? 'תוסיפי לרשימה' : 'תוסיף לרשימה';
  const searchLabel = isF ? 'חפשי ביוטיוב' : 'חפש ביוטיוב';

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/events/${eventCode}/songs/me?session_token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { picks: MyPick[] };
      setPicks(data.picks ?? []);
    } catch {
      /* network blip — keep the previous list */
    }
  }, [eventCode, token]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  // Auto-clear the flash banner so it doesn't stick.
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(id);
  }, [flash]);

  async function submit() {
    const title = songTitle.trim();
    if (!title || busy) return;
    haptic('light');
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventCode}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: token,
          song_title: title,
          artist: artist.trim() || undefined,
          youtube_url: youtubeUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { duplicate?: boolean; error?: string };
      if (!res.ok) {
        haptic('error');
        setFlash({ kind: 'err', text: data.error ?? 'נכשל לשמור — נסה/י שוב' });
        return;
      }
      if (data.duplicate) {
        // Not a real error — just a soft "you already did this" buzz.
        haptic('warn');
        setFlash({ kind: 'dup', text: 'כבר הוספת את השיר הזה' });
      } else {
        haptic('success');
        setFlash({ kind: 'ok', text: 'נוסף! 🎵' });
      }
      setSongTitle('');
      setArtist('');
      setYoutubeUrl('');
      await loadMine();
    } catch {
      haptic('error');
      setFlash({ kind: 'err', text: 'אין רשת — נסה/י עוד רגע' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(pickId: string) {
    haptic('light');
    try {
      const res = await fetch(`/api/events/${eventCode}/songs/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, pick_id: pickId }),
      });
      if (!res.ok) {
        haptic('error');
        return;
      }
      // Optimistic — drop locally and refresh from the server.
      setPicks((prev) => prev.filter((p) => p.id !== pickId));
      loadMine();
    } catch {
      haptic('error');
    }
  }

  function openYoutubeSearch() {
    const query = [songTitle.trim(), artist.trim()].filter(Boolean).join(' ');
    const target = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      : 'https://www.youtube.com/';
    haptic('light');
    if (typeof window !== 'undefined') {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <section className="mb-4 panel-strong p-4 space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold gold-shimmer">🎵 השירים שלך לרחבה</h2>
        {picks.length > 0 && <span className="text-xs text-muted">{picks.length} שירים</span>}
      </header>
      <p className="text-xs text-muted leading-snug">
        {isF ? 'תוסיפי' : 'תוסיף'} כל שיר {isF ? 'שאת רוצה' : 'שאתה רוצה'} — ה-DJ ינגן בסוף לפי דירוג כללי.
      </p>

      <div className="space-y-2">
        <input
          type="text"
          inputMode="text"
          maxLength={120}
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="שם השיר"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-gold"
        />
        <input
          type="text"
          inputMode="text"
          maxLength={80}
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="אומן/ית (אופציונלי)"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-gold"
        />
        <input
          type="url"
          dir="ltr"
          maxLength={400}
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="קישור יוטיוב (אופציונלי)"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-gold text-left"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openYoutubeSearch}
            className="flex-1 panel rounded-xl px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/10 tap-press"
          >
            🔍 {searchLabel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || songTitle.trim().length === 0}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-bold bg-gold-gradient text-black disabled:opacity-50 disabled:cursor-not-allowed tap-press"
          >
            {busy ? '...' : `+ ${addLabel}`}
          </button>
        </div>
        {flash && (
          <div
            className={`text-xs text-center py-1 rounded-lg ${
              flash.kind === 'ok'
                ? 'text-success'
                : flash.kind === 'dup'
                  ? 'text-gold'
                  : 'text-danger'
            }`}
          >
            {flash.text}
          </div>
        )}
      </div>

      {picks.length > 0 && (
        <ul className="space-y-1.5 pt-1 border-t border-white/5">
          {picks.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight truncate">{p.song_title}</div>
                {p.artist && (
                  <div className="text-[11px] text-muted leading-tight truncate">{p.artist}</div>
                )}
              </div>
              {p.youtube_url && (
                <a
                  href={p.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300"
                  aria-label="פתח ביוטיוב"
                  title="פתח ביוטיוב"
                >
                  ▶
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-xs text-muted hover:text-danger px-1.5 tap-press"
                aria-label="הסר"
              >
                × הסר
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
