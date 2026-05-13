-- DEMO event seed
-- Run after the initial migration to get a working /stage/DEMO12 out of the box.

insert into events (id, event_code, name, child_name, status, theme, venue)
values (
  'a1111111-1111-1111-1111-111111111111',
  'DEMO12',
  'בת המצווה של רומי',
  'רומי',
  'live',
  '{"primary":"#D8A84E","accent":"#D82DFF"}'::jsonb,
  'אולמי הזהב'
)
on conflict (event_code) do nothing;

insert into live_sessions (event_id, stage_state)
values ('a1111111-1111-1111-1111-111111111111', 'JOIN_SCREEN')
on conflict (event_id) do nothing;

-- Enable six games for the DEMO event
insert into event_games (event_id, game_type, title, is_enabled, wheel_weight, order_index)
values
  ('a1111111-1111-1111-1111-111111111111', 'secret_mission',       'משימה סודית',   true, 1, 0),
  ('a1111111-1111-1111-1111-111111111111', 'what_are_the_chances', 'מה הסיכוי',     true, 1, 1),
  ('a1111111-1111-1111-1111-111111111111', 'what_happened_next',   'מה קרה אחר כך', true, 1, 2),
  ('a1111111-1111-1111-1111-111111111111', 'true_or_false',        'נכון או לא נכון', true, 1, 3),
  ('a1111111-1111-1111-1111-111111111111', 'musical_chairs',       'משחק הכיסאות',  true, 1, 4),
  ('a1111111-1111-1111-1111-111111111111', 'truth_or_lie',         'אמת או שקר',    true, 1, 5)
on conflict do nothing;
