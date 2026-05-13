export type StageState =
  | 'JOIN_SCREEN'
  | 'GREETINGS_WALL'
  | 'WHEEL_IDLE'
  | 'WHEEL_SPINNING'
  | 'GAME_INTRO'
  | 'GAME_ACTIVE'
  | 'GAME_RESULTS'
  | 'BREAK_SCREEN'
  | 'FINAL_SCREEN';

export type WheelStatus = 'idle' | 'spinning' | 'stopped';

export interface LiveSession {
  id: string;
  event_id: string;
  stage_state: StageState;
  active_event_game_id: string | null;
  active_question_id: string | null;
  wheel_status: WheelStatus;
  wheel_selected_game_id: string | null;
  current_payload: Record<string, unknown>;
  updated_at: string;
}

export const STAGE_STATE_LABELS: Record<StageState, string> = {
  JOIN_SCREEN: 'מסך הצטרפות',
  GREETINGS_WALL: 'קיר ברכות',
  WHEEL_IDLE: 'גלגל המתנה',
  WHEEL_SPINNING: 'גלגל מסתובב',
  GAME_INTRO: 'פתיח משחק',
  GAME_ACTIVE: 'משחק פעיל',
  GAME_RESULTS: 'תוצאות משחק',
  BREAK_SCREEN: 'הפסקה',
  FINAL_SCREEN: 'מסך סיום',
};
