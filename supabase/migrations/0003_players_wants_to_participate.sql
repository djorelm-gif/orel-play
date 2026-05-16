-- Player opt-in flag for "physical" games (musical chairs, secret missions).
-- The host's random-pick UI draws only from this pool, so a kid who doesn't
-- want to be put on the spot can stay out of the lottery without leaving the
-- game.
ALTER TABLE op_players
  ADD COLUMN IF NOT EXISTS wants_to_participate boolean NOT NULL DEFAULT false;
