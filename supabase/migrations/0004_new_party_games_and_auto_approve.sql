-- 2026-06-17: Restructure the wheel to the new 8-game lineup + add an
-- auto-approve toggle for greetings.

-- Per-event toggle: when true, AI-approved greetings skip the host's queue.
ALTER TABLE op_events
  ADD COLUMN IF NOT EXISTS auto_approve_greetings boolean NOT NULL DEFAULT false;

-- Re-title the existing what_happened_next game (was "מה קרה אחר כך").
UPDATE op_event_games SET title = 'המשך את הסיפור' WHERE game_type = 'what_happened_next';

-- Disable the three games that are no longer on the wheel. We keep the rows
-- so any past data (e.g. answers) still has a parent.
UPDATE op_event_games SET is_enabled = false
WHERE game_type IN ('secret_mission', 'musical_chairs', 'truth_or_lie');

-- Seed the five new host-led party games for every existing event.
INSERT INTO op_event_games (event_id, game_type, title, is_enabled, wheel_weight, order_index, config)
SELECT e.id, t.game_type, t.title, true, 1, t.order_index, '{}'::jsonb
FROM op_events e
CROSS JOIN (VALUES
  ('ten_boom', '10 בום', 6),
  ('grandma_pregnant', 'סבתא בהריון', 7),
  ('what_didnt_i_hear', 'מה לא שמעתי', 8),
  ('one_day', 'יום מן הימים', 9),
  ('obstacle_course', 'מסלול מכשולים', 10)
) AS t(game_type, title, order_index)
WHERE NOT EXISTS (
  SELECT 1 FROM op_event_games eg
  WHERE eg.event_id = e.id AND eg.game_type = t.game_type
);

-- Refresh the seed function so new events get the new lineup by default.
CREATE OR REPLACE FUNCTION public.seed_new_event_children() RETURNS trigger AS $$
DECLARE
  game_def record;
BEGIN
  INSERT INTO op_live_sessions (event_id, stage_state)
  VALUES (NEW.id, 'JOIN_SCREEN')
  ON CONFLICT (event_id) DO NOTHING;

  FOR game_def IN (
    SELECT * FROM (VALUES
      ('true_or_false', 'נכון או לא נכון', 0, true),
      ('what_happened_next', 'המשך את הסיפור', 1, true),
      ('what_are_the_chances', 'מה הסיכוי', 2, true),
      ('ten_boom', '10 בום', 3, true),
      ('grandma_pregnant', 'סבתא בהריון', 4, true),
      ('what_didnt_i_hear', 'מה לא שמעתי', 5, true),
      ('one_day', 'יום מן הימים', 6, true),
      ('obstacle_course', 'מסלול מכשולים', 7, true),
      ('secret_mission', 'משימה סודית', 8, false),
      ('musical_chairs', 'משחק הכיסאות', 9, false),
      ('truth_or_lie', 'אמת או שקר', 10, false)
    ) AS t(game_type, title, order_index, is_enabled)
  ) LOOP
    INSERT INTO op_event_games (event_id, game_type, title, is_enabled, wheel_weight, order_index)
    VALUES (NEW.id, game_def.game_type, game_def.title, game_def.is_enabled, 1, game_def.order_index);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
