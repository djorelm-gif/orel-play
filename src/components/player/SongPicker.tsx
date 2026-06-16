'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface SearchHit {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; hits: SearchHit[] }
  | { kind: 'empty' } // search ran, zero results
  | { kind: 'down' }; // proxy returned 503 — auto-open manual form

// Inline song-picker shown to guests on idle stage states. Primary affordance
// is now an in-app YouTube search box; the original manual title/artist/URL
// inputs are tucked behind an "advanced" disclosure as a fallback for both
// power users and the case where the search proxy is unavailable.
export function SongPicker({ eventCode, token, me }: { eventCode: string; token: string; me: Player }) {
  // --- search state ---
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ kind: 'idle' });
  // Picks currently being added to prevent double-taps; keyed by video id.
  const [adding, setAdding] = useState<Set<string>>(new Set());
  // Whether the advanced disclosure should be force-open (set when proxy is
  // down so the user can still submit a song manually).
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // --- manual fallback fields ---
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // --- shared state ---
  const [picks, setPicks] = useState<MyPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err' | 'dup'; text: string } | null>(null);

  const isF = me.gender === 'female';
  const addLabel = isF ? 'תוסיפי לרשימה' : 'תוסיף לרשימה';
  const searchPlaceholder = isF ? 'חפשי שיר ביוטיוב' : 'חפש שיר ביוטיוב';
  const searchLabelShort = isF ? 'חפשי' : 'חפש';
  const advancedLabel = 'אפשרות מתקדמת — הזנה ידנית';

  // Stable set of video ids already in this player's picks list so we can dim
  // matching search results.
  const alreadyPickedIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of picks) {
      if (p.youtube_video_id) set.add(p.youtube_video_id);
    }
    return set;
  }, [picks]);

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

  // --- debounced search ---
  // We keep a counter ref so an in-flight stale response can be discarded if a
  // newer query has already kicked off.
  const requestSeq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setSearch({ kind: 'idle' });
      return;
    }
    const mySeq = ++requestSeq.current;
    setSearch({ kind: 'loading' });
    const handle = setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`, {
            cache: 'no-store',
          });
          if (mySeq !== requestSeq.current) return; // a newer keystroke won
          if (res.status === 503) {
            setSearch({ kind: 'down' });
            setAdvancedOpen(true);
            return;
          }
          if (!res.ok) {
            // 400 (e.g. validation) — just go quiet rather than scare the user.
            setSearch({ kind: 'empty' });
            return;
          }
          const data = (await res.json()) as { results?: SearchHit[] };
          const hits = data.results ?? [];
          setSearch(hits.length > 0 ? { kind: 'ok', hits } : { kind: 'empty' });
        } catch {
          if (mySeq !== requestSeq.current) return;
          // True network failure — fall back to manual mode like a 503 would.
          setSearch({ kind: 'down' });
          setAdvancedOpen(true);
        }
      })();
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // --- shared add helper ---
  // Persists a pick via the existing POST endpoint. `source` switches the
  // user-facing flash and the haptic patterns are the same in both paths.
  async function addPick(opts: {
    songTitle: string;
    artist: string | null;
    youtubeUrl: string | null;
    videoId: string | null;
  }): Promise<'ok' | 'duplicate' | 'error'> {
    const res = await fetch(`/api/events/${eventCode}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_token: token,
        song_title: opts.songTitle,
        artist: opts.artist ?? undefined,
        youtube_url: opts.youtubeUrl ?? undefined,
        // Server re-parses the URL anyway, but pass the id along so
        // server-side persists the same one if there's any ambiguity.
        youtube_video_id: opts.videoId ?? undefined,
      }),
    });
    const data = (await res.json()) as { duplicate?: boolean; error?: string };
    if (!res.ok) {
      setFlash({ kind: 'err', text: data.error ?? 'נכשל לשמור — נסה/י שוב' });
      return 'error';
    }
    if (data.duplicate) {
      setFlash({ kind: 'dup', text: 'כבר הוספת את השיר הזה' });
      return 'duplicate';
    }
    setFlash({ kind: 'ok', text: 'נוסף! 🎵' });
    return 'ok';
  }

  // Tap a search card to add it.
  async function pickHit(hit: SearchHit) {
    if (adding.has(hit.id) || alreadyPickedIds.has(hit.id)) return;
    haptic('light');
    setAdding((prev) => {
      const next = new Set(prev);
      next.add(hit.id);
      return next;
    });
    try {
      const result = await addPick({
        songTitle: hit.title,
        artist: hit.channel || null,
        youtubeUrl: `https://www.youtube.com/watch?v=${hit.id}`,
        videoId: hit.id,
      });
      if (result === 'ok') haptic('success');
      else if (result === 'duplicate') haptic('warn');
      else haptic('error');
      await loadMine();
    } catch {
      haptic('error');
      setFlash({ kind: 'err', text: 'אין רשת — נסה/י עוד רגע' });
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(hit.id);
        return next;
      });
    }
  }

  // Manual-form submit (fallback path).
  async function submitManual() {
    const title = songTitle.trim();
    if (!title || busy) return;
    haptic('light');
    setBusy(true);
    try {
      const result = await addPick({
        songTitle: title,
        artist: artist.trim() || null,
        youtubeUrl: youtubeUrl.trim() || null,
        videoId: null,
      });
      if (result === 'ok') haptic('success');
      else if (result === 'duplicate') haptic('warn');
      else haptic('error');
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

  return (
    <section className="mb-4 panel-strong p-4 space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold gold-shimmer">🎵 השירים שלך לרחבה</h2>
        {picks.length > 0 && <span className="text-xs text-muted">{picks.length} שירים</span>}
      </header>
      <p className="text-xs text-muted leading-snug">
        {isF ? 'תוסיפי' : 'תוסיף'} כל שיר {isF ? 'שאת רוצה' : 'שאתה רוצה'} — ה-DJ ינגן בסוף לפי דירוג כללי.
      </p>

      {/* --- search box --- */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            inputMode="search"
            maxLength={120}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`🔍 ${searchPlaceholder}`}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
            aria-label={searchLabelShort}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearch({ kind: 'idle' });
              }}
              className="absolute inset-y-0 left-2 text-xs text-muted hover:text-white/80 px-2"
              aria-label="נקה חיפוש"
            >
              ✕
            </button>
          )}
        </div>

        {/* --- results --- */}
        {search.kind === 'loading' && (
          <ul className="space-y-1.5" aria-busy="true" aria-label="טוען...">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg bg-black/20 p-2 animate-pulse"
              >
                <div className="w-24 h-[72px] rounded-md bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5 py-1">
                  <div className="h-3 rounded bg-white/10 w-5/6" />
                  <div className="h-3 rounded bg-white/10 w-2/3" />
                  <div className="h-2.5 rounded bg-white/10 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {search.kind === 'ok' && (
          <ul className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {search.hits.map((hit) => {
              const isAdding = adding.has(hit.id);
              const isPicked = alreadyPickedIds.has(hit.id);
              const disabled = isAdding || isPicked;
              return (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => pickHit(hit)}
                    disabled={disabled}
                    className={`w-full flex gap-2 rounded-lg bg-black/20 p-2 text-right tap-press transition ${
                      disabled
                        ? 'opacity-50 cursor-default'
                        : 'hover:bg-black/30'
                    }`}
                  >
                    <Thumbnail src={hit.thumbnail} title={hit.title} duration={hit.duration} />
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="text-sm leading-snug line-clamp-2 font-medium">
                        {hit.title}
                      </div>
                      {hit.channel && (
                        <div className="text-[11px] text-muted leading-tight truncate mt-0.5">
                          {hit.channel}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center pr-1">
                      {isPicked ? (
                        <span className="text-success text-base" aria-label="כבר נוסף">
                          ✓
                        </span>
                      ) : isAdding ? (
                        <span className="text-xs text-muted">…</span>
                      ) : (
                        <span className="text-gold text-lg leading-none" aria-hidden>
                          +
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {search.kind === 'empty' && (
          <div className="text-xs text-muted text-center py-2">
            לא נמצאו תוצאות — {isF ? 'נסי' : 'נסה'} חיפוש אחר
          </div>
        )}

        {search.kind === 'down' && (
          <div className="text-xs text-gold text-center py-2 leading-snug">
            החיפוש נופל זמנית — {isF ? 'את' : 'אתה'} {isF ? 'יכולה' : 'יכול'} להזין ידנית למטה
          </div>
        )}

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

      {/* --- advanced / fallback manual form ---
          We use a controlled <details> so when the search proxy returns 503
          we can force-open it, but the user can still close/reopen freely. */}
      <details
        className="rounded-xl border border-white/5 bg-black/10 px-3 py-2"
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="text-xs text-muted cursor-pointer select-none">
          {advancedLabel}
        </summary>
        <div className="space-y-2 pt-2">
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
          <button
            type="button"
            onClick={submitManual}
            disabled={busy || songTitle.trim().length === 0}
            className="w-full rounded-xl px-3 py-2 text-sm font-bold bg-gold-gradient text-black disabled:opacity-50 disabled:cursor-not-allowed tap-press"
          >
            {busy ? '...' : `+ ${addLabel}`}
          </button>
        </div>
      </details>

      {/* --- this player's picks --- */}
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

// 96×72 result thumbnail. YouTube's i.ytimg.com serves CORS headers for image
// requests with `crossOrigin="anonymous"`, but if the network fails or the
// hostname blocks us we drop the <img> and show a gold-gradient placeholder
// with the duration label so the row still reads as a card.
function Thumbnail({
  src,
  title,
  duration,
}: {
  src: string;
  title: string;
  duration: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !failed && src.length > 0;
  return (
    <div className="relative w-24 h-[72px] rounded-md overflow-hidden bg-black/40 shrink-0">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gold-gradient flex items-center justify-center text-black/60 text-lg">
          🎵
        </div>
      )}
      {duration && (
        <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[10px] text-white/90 px-1 rounded leading-none py-0.5 font-mono">
          {duration}
        </span>
      )}
    </div>
  );
}
