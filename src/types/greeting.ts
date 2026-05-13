export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export interface Greeting {
  id: string;
  event_id: string;
  player_id: string | null;
  display_name: string;
  photo_url: string | null;
  message: string;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  shown_on_stage: boolean;
  created_at: string;
}

export interface ModerationResult {
  status: ModerationStatus;
  safeMessage: string;
  reason: string;
}
