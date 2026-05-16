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
  total_score: number;
  status: PlayerStatus;
  joined_at: string;
}
