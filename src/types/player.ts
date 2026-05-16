export type PlayerStatus = 'active' | 'idle' | 'kicked';
export type PlayerGender = 'male' | 'female';

export interface Player {
  id: string;
  event_id: string;
  display_name: string;
  photo_url: string | null;
  team_name: string | null;
  session_token: string;
  is_child_star: boolean;
  gender: PlayerGender | null;
  notifications_opt_in: boolean;
  push_subscription: unknown | null;
  // Player marked themselves as wanting to be picked for physical games like
  // musical chairs or secret missions. The host's random-pick draws only
  // from this pool.
  wants_to_participate: boolean;
  total_score: number;
  status: PlayerStatus;
  joined_at: string;
}
