export type EventStatus = 'draft' | 'live' | 'ended';

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
  event_date: string | null;
  venue: string | null;
  status: EventStatus;
  theme: EventTheme;
  host_token: string | null;     // secret token for the bat-mitzvah-girl wizard
  profile_complete: boolean;     // wizard finished + questions generated
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
