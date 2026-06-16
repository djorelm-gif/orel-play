import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { normalizeSongKey, parseYouTubeVideoId } from '@/lib/songs/normalize';

export const dynamic = 'force-dynamic';

interface SongRow {
  id: string;
  event_id: string;
  player_id: string | null;
  song_title: string;
  artist: string | null;
  youtube_video_id: string | null;
  youtube_url: string | null;
  norm_key: string;
  created_at: string;
}

interface RankedSong {
  norm_key: string;
  song_title: string;
  artist: string | null;
  youtube_video_id: string | null;
  youtube_url: string | null;
  picks: number;
}

// POST — guest picks a song. Body: { session_token, song_title, youtube_url?, artist? }
export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as {
    session_token?: string;
    song_title?: string;
    artist?: string;
    youtube_url?: string;
  };

  if (!body.session_token) {
    return NextResponse.json({ error: 'חסר חיבור' }, { status: 401 });
  }
  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player || player.event_id !== event.id) {
    return NextResponse.json({ error: 'חיבור לא תקין' }, { status: 401 });
  }

  const song_title = (body.song_title ?? '').trim();
  if (song_title.length < 1 || song_title.length > 120) {
    return NextResponse.json({ error: 'שם השיר לא תקין (1-120 תווים)' }, { status: 400 });
  }
  const artist = (body.artist ?? '').trim().slice(0, 80) || null;
  const youtube_url_raw = (body.youtube_url ?? '').trim();
  const youtube_url = youtube_url_raw.length > 0 ? youtube_url_raw.slice(0, 400) : null;
  const youtube_video_id = youtube_url ? parseYouTubeVideoId(youtube_url) : null;
  const norm_key = normalizeSongKey(song_title);

  const sb = getSupabaseAdmin();
  if (!sb) {
    // Demo mode: song picks aren't persisted; reply as if accepted so the UI works.
    return NextResponse.json({
      pick: {
        id: `demo-${Date.now()}`,
        event_id: event.id,
        player_id: player.id,
        song_title,
        artist,
        youtube_url,
        youtube_video_id,
        norm_key,
        created_at: new Date().toISOString(),
      },
      duplicate: false,
      demo: true,
    });
  }

  const { data, error } = await sb
    .from('op_song_picks')
    .insert({
      event_id: event.id,
      player_id: player.id,
      song_title,
      artist,
      youtube_url,
      youtube_video_id,
      norm_key,
    })
    .select()
    .single();

  if (error) {
    // Postgres unique-violation = 23505 → guest already picked this song. Treat
    // as success so the UI doesn't show a scary error.
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ duplicate: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pick: data, duplicate: false });
}

// GET — ranked aggregate of picks for the admin leaderboard.
export async function GET(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ songs: [], total: 0 });

  const url = new URL(req.url);
  const limitParam = parseInt(url.searchParams.get('limit') ?? '30', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 30;

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ songs: [], total: 0, demo: true });
  }

  const { data, error } = await sb
    .from('op_song_picks')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ songs: [], total: 0, error: error.message }, { status: 500 });
  }

  const rows = (data as SongRow[] | null) ?? [];
  const groups = new Map<string, RankedSong>();
  for (const r of rows) {
    const existing = groups.get(r.norm_key);
    if (existing) {
      existing.picks += 1;
      // Fill in better representative fields if the existing group is missing them.
      if (!existing.artist && r.artist) existing.artist = r.artist;
      if (!existing.youtube_url && r.youtube_url) {
        existing.youtube_url = r.youtube_url;
        existing.youtube_video_id = r.youtube_video_id;
      }
    } else {
      // Rows are pre-sorted DESC by created_at, so this is the most recent
      // representative — exactly the "MAX(created_at) keyed" semantics.
      groups.set(r.norm_key, {
        norm_key: r.norm_key,
        song_title: r.song_title,
        artist: r.artist,
        youtube_video_id: r.youtube_video_id,
        youtube_url: r.youtube_url,
        picks: 1,
      });
    }
  }

  const songs = Array.from(groups.values())
    .sort((a, b) => b.picks - a.picks || a.song_title.localeCompare(b.song_title, 'he'))
    .slice(0, limit);

  return NextResponse.json({ songs, total: rows.length });
}
