export type EventStatus = 'draft' | 'live' | 'ended';
export type EventType = 'bat_mitzvah' | 'bar_mitzvah';

export interface EventTheme {
  primary?: string;
  accent?: string;
  childPhotoUrl?: string;
}

export interface OrelEvent {
  id: string;
  event_code: string;
  name: string;
  child_name: string;
  event_type: EventType;
  event_date: string | null;
  venue: string | null;
  status: EventStatus;
  theme: EventTheme;
  host_token: string | null;
  profile_complete: boolean;
  // When true, greetings that the AI moderator approves bypass the host's
  // moderation queue and go straight to the wall. Default false for safety.
  auto_approve_greetings: boolean;
  // When true (default), the stage auto-returns to the wheel 8 sec after a
  // game ends so the host doesn't have to babysit every transition. Host
  // can toggle this off from the moderation drawer.
  auto_advance_after_results: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatMitzvahProfile {
  id: string;
  event_id: string;
  answers: Record<string, string | string[]>;
  completed_at: string | null;
  updated_at: string;
}
