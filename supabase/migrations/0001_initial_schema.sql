-- OREL PLAY — initial schema
-- Run this in Supabase SQL editor.

-- events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_code text unique not null,
  name text not null,
  child_name text not null,
  event_date date,
  venue text,
  status text not null default 'draft',
  theme jsonb default '{}'::jsonb,
  host_token text unique,
  profile_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- bat_mitzvah_profile — what the child filled out about herself
create table if not exists bat_mitzvah_profile (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade unique,
  answers jsonb default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz default now()
);

-- players
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  display_name text not null,
  photo_url text,
  team_name text,
  session_token text unique,
  is_child_star boolean default false,
  total_score integer default 0,
  status text default 'active',
  joined_at timestamptz default now()
);

-- greetings
create table if not exists greetings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  display_name text not null,
  photo_url text,
  message text not null,
  moderation_status text not null default 'pending',
  moderation_reason text,
  approved_by text,
  approved_at timestamptz,
  shown_on_stage boolean default false,
  created_at timestamptz default now()
);

-- game_templates
create table if not exists game_templates (
  id uuid primary key default gen_random_uuid(),
  type text unique not null,
  title text not null,
  description text,
  default_config jsonb default '{}'::jsonb,
  is_active boolean default true
);

insert into game_templates (type, title) values
  ('secret_mission', 'משימה סודית'),
  ('what_are_the_chances', 'מה הסיכוי'),
  ('what_happened_next', 'מה קרה אחר כך'),
  ('true_or_false', 'נכון או לא נכון'),
  ('musical_chairs', 'משחק הכיסאות'),
  ('truth_or_lie', 'אמת או שקר')
on conflict (type) do nothing;

-- event_games
create table if not exists event_games (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  game_type text not null,
  title text not null,
  is_enabled boolean default true,
  wheel_weight integer default 1,
  order_index integer default 0,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- game_questions
create table if not exists game_questions (
  id uuid primary key default gen_random_uuid(),
  event_game_id uuid references event_games(id) on delete cascade,
  question_text text not null,
  media_url text,
  correct_answer text,
  options jsonb default '[]'::jsonb,
  config jsonb default '{}'::jsonb,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- live_sessions
create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade unique,
  stage_state text not null default 'JOIN_SCREEN',
  active_event_game_id uuid references event_games(id) on delete set null,
  active_question_id uuid references game_questions(id) on delete set null,
  wheel_status text default 'idle',
  wheel_selected_game_id uuid references event_games(id) on delete set null,
  current_payload jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- player_answers
create table if not exists player_answers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  event_game_id uuid references event_games(id) on delete cascade,
  question_id uuid references game_questions(id) on delete cascade,
  answer_text text,
  answer_payload jsonb default '{}'::jsonb,
  is_correct boolean,
  points_awarded integer default 0,
  response_time_ms integer,
  created_at timestamptz default now()
);

-- secret_missions
create table if not exists secret_missions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  event_game_id uuid references event_games(id) on delete cascade,
  mission_text text not null,
  assigned_to_player_id uuid references players(id) on delete set null,
  assigned_to_team text,
  status text default 'draft',
  result text,
  created_at timestamptz default now(),
  assigned_at timestamptz
);

-- audit_logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  actor_type text,
  actor_id text,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- enable realtime
alter publication supabase_realtime add table live_sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table greetings;
alter publication supabase_realtime add table player_answers;
alter publication supabase_realtime add table secret_missions;

-- indexes
create index if not exists idx_players_event on players(event_id);
create index if not exists idx_greetings_event on greetings(event_id);
create index if not exists idx_greetings_status on greetings(moderation_status);
create index if not exists idx_event_games_event on event_games(event_id);
create index if not exists idx_game_questions_event_game on game_questions(event_game_id);
create index if not exists idx_player_answers_event_game on player_answers(event_game_id, question_id);
