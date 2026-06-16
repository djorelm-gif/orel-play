-- Auto-advance from GAME_RESULTS back to the wheel after a short pause.
-- Default true: a typical event runs games back-to-back; the host can flip
-- this off from the moderation drawer if they want manual control.
ALTER TABLE op_events
  ADD COLUMN IF NOT EXISTS auto_advance_after_results boolean NOT NULL DEFAULT true;
