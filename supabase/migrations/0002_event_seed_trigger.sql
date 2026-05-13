-- When a new event row is inserted, automatically:
--   1. Generate a random host_token (for the bat-mitzvah-girl wizard URL)
--   2. Seed the 6 standard event_games
--   3. Seed a live_session in JOIN_SCREEN state

create or replace function public.seed_new_event() returns trigger as $$
declare
  game_def record;
begin
  -- 1) host_token if missing
  if new.host_token is null then
    new.host_token := replace(gen_random_uuid()::text, '-', '');
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_before_insert on events;
create trigger trg_events_before_insert
  before insert on events
  for each row execute function public.seed_new_event();

-- After-insert: create live_session + 6 event_games
create or replace function public.seed_new_event_children() returns trigger as $$
declare
  game_def record;
  i int := 0;
begin
  insert into live_sessions (event_id, stage_state) values (new.id, 'JOIN_SCREEN') on conflict (event_id) do nothing;

  for game_def in (
    select * from (values
      ('secret_mission', 'משימה סודית', 0),
      ('what_are_the_chances', 'מה הסיכוי', 1),
      ('what_happened_next', 'מה קרה אחר כך', 2),
      ('true_or_false', 'נכון או לא נכון', 3),
      ('musical_chairs', 'משחק הכיסאות', 4),
      ('truth_or_lie', 'אמת או שקר', 5)
    ) as t(game_type, title, order_index)
  ) loop
    insert into event_games (event_id, game_type, title, is_enabled, wheel_weight, order_index)
    values (new.id, game_def.game_type, game_def.title, true, 1, game_def.order_index);
  end loop;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_after_insert on events;
create trigger trg_events_after_insert
  after insert on events
  for each row execute function public.seed_new_event_children();
