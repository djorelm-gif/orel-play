-- 2026-06-17: Guest song picks for the DJ.
-- Each guest can pick any number of songs (free-form title + optional artist +
-- optional YouTube URL). The admin sees an aggregate leaderboard ranked by
-- number of picks per song. norm_key is the dedup key so case/whitespace
-- variants ("Espresso", "espresso", " ESPRESSO ") group together.

CREATE TABLE IF NOT EXISTS op_song_picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references op_events(id) on delete cascade not null,
  player_id uuid references op_players(id) on delete cascade,
  song_title text not null,
  artist text,
  youtube_video_id text,
  youtube_url text,
  -- Normalised dedup key so we can group "Espresso", "espresso" and " ESPRESSO " together.
  norm_key text not null,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS op_song_picks_event_idx ON op_song_picks(event_id);
CREATE INDEX IF NOT EXISTS op_song_picks_norm_idx ON op_song_picks(event_id, norm_key);

-- Prevent the same player from picking the same song twice. NULL player_id
-- (e.g. anonymous future flow) is allowed to repeat — only authenticated
-- player picks are deduped.
CREATE UNIQUE INDEX IF NOT EXISTS op_song_picks_unique_player_song
  ON op_song_picks(event_id, player_id, norm_key)
  WHERE player_id IS NOT NULL;

-- All other op_* tables run with RLS disabled (writes go through our API
-- routes with the admin client). Supabase auto-enables RLS on new tables, so
-- match the existing convention explicitly.
ALTER TABLE op_song_picks DISABLE ROW LEVEL SECURITY;
