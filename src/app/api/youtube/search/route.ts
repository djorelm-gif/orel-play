import { NextResponse } from 'next/server';
// `yt-search` ships no TypeScript types, so we describe what we use inline.
// It's CommonJS — `import yts from 'yt-search'` works under our Next/TS setup.
import yts from 'yt-search';

// Node runtime — yt-search depends on Node-only modules (cheerio, http parsing).
export const runtime = 'nodejs';
// Never cache: search queries are arbitrary and YouTube results shift constantly.
export const dynamic = 'force-dynamic';

interface YtsVideo {
  videoId: string;
  title: string;
  author?: { name?: string };
  thumbnail?: string;
  image?: string;
  duration?: { timestamp?: string };
  timestamp?: string;
}

interface YtsResult {
  videos?: YtsVideo[];
}

interface SearchHit {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

// GET /api/youtube/search?q=... — used by the guest song picker for inline
// search-as-you-type. Returns the top 12 video hits. On any failure we return
// 503 with a stable shape so the client can fall back to the manual form.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get('q') ?? '').trim();

  if (raw.length === 0 || raw.length > 120) {
    return NextResponse.json(
      { error: 'invalid_query', results: [] },
      { status: 400 },
    );
  }

  try {
    // `yts(query)` is the documented one-arg form — searches videos by default.
    const result = (await yts(raw)) as YtsResult;
    const videos = Array.isArray(result?.videos) ? result.videos : [];

    const hits: SearchHit[] = videos
      .filter((v): v is YtsVideo & { videoId: string; title: string } =>
        typeof v?.videoId === 'string' && typeof v?.title === 'string',
      )
      .slice(0, 12)
      .map((v) => ({
        id: v.videoId,
        title: v.title,
        channel: v.author?.name ?? '',
        // `image` is the high-res variant; `thumbnail` is sometimes square.
        // Either one is fine for our 96×72 card; prefer the larger.
        thumbnail: v.image || v.thumbnail || '',
        duration: v.duration?.timestamp || v.timestamp || '',
      }));

    return NextResponse.json({ results: hits });
  } catch (err) {
    // yt-search scrapes the public results page — if YouTube changes the markup
    // or rate-limits us we surface a 503 so the UI can swap to the manual form.
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json(
      { error: 'youtube_unavailable', detail: message, results: [] },
      { status: 503 },
    );
  }
}
