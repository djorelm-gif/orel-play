export type GameType =
  | 'secret_mission'
  | 'what_are_the_chances'
  | 'what_happened_next'
  | 'true_or_false'
  | 'musical_chairs'
  | 'truth_or_lie'
  // Host-led physical party games — no AI questions, just stage rules and
  // host pacing controls.
  | 'ten_boom'
  | 'grandma_pregnant'
  | 'what_didnt_i_hear'
  | 'one_day'
  | 'obstacle_course';

export const GAME_TYPES: GameType[] = [
  'secret_mission',
  'what_are_the_chances',
  'what_happened_next',
  'true_or_false',
  'musical_chairs',
  'truth_or_lie',
  'ten_boom',
  'grandma_pregnant',
  'what_didnt_i_hear',
  'one_day',
  'obstacle_course',
];

export const GAME_TITLES: Record<GameType, string> = {
  secret_mission: 'משימה סודית',
  what_are_the_chances: 'מה הסיכוי',
  what_happened_next: 'המשך את הסיפור',
  true_or_false: 'נכון או לא נכון',
  musical_chairs: 'משחק הכיסאות',
  truth_or_lie: 'אמת או שקר',
  ten_boom: '10 בום',
  grandma_pregnant: 'סבתא בהריון',
  what_didnt_i_hear: 'מה לא שמעתי',
  one_day: 'יום מן הימים',
  obstacle_course: 'מסלול מכשולים',
};

export const GAME_DESCRIPTIONS: Record<GameType, string> = {
  secret_mission: 'משימה חשאית נשלחת לילד או לשולחן',
  what_are_the_chances: 'נחשו את הסיכוי שזה יקרה',
  what_happened_next: 'נקודת פתיחה — תמשיכו את הסיפור',
  true_or_false: 'תשובות מהירות — נכון או לא נכון',
  musical_chairs: 'הגרסה הדיגיטלית למשחק הכיסאות',
  truth_or_lie: 'סיפור דרמטי — אמת או שקר?',
  ten_boom: 'סופרים — וצועקים בום במקום מספרים מסוכנים',
  grandma_pregnant: 'משחק זיכרון אינסופי — מה סבתא רוצה לאכול',
  what_didnt_i_hear: 'שחקן יוצא, הקהל ממציא — מה לא נאמר?',
  one_day: 'מתחילים סיפור — תורם מילה אחרי תור',
  obstacle_course: 'מסלול אתגרים פיזי באולם — מי הראשון/ה?',
};

export interface EventGame {
  id: string;
  event_id: string;
  game_type: GameType;
  title: string;
  is_enabled: boolean;
  wheel_weight: number;
  order_index: number;
  config: Record<string, unknown>;
  created_at: string;
}

export interface GameQuestion {
  id: string;
  event_game_id: string;
  question_text: string;
  media_url: string | null;
  correct_answer: string | null;
  options: Array<{ id: string; label: string }>;
  config: Record<string, unknown>;
  order_index: number;
  created_at: string;
}

export type GameLifecycle =
  | 'IDLE'
  | 'INTRO'
  | 'WAITING_FOR_PLAYERS'
  | 'ACTIVE'
  | 'LOCKED'
  | 'REVEAL'
  | 'RESULTS'
  | 'ENDED';

export interface PlayerAnswer {
  id: string;
  event_id: string;
  player_id: string;
  event_game_id: string;
  question_id: string;
  answer_text: string | null;
  answer_payload: Record<string, unknown>;
  is_correct: boolean | null;
  points_awarded: number;
  response_time_ms: number | null;
  created_at: string;
}

export interface SecretMission {
  id: string;
  event_id: string;
  event_game_id: string;
  mission_text: string;
  assigned_to_player_id: string | null;
  assigned_to_team: string | null;
  status: 'draft' | 'assigned' | 'success' | 'fail';
  result: string | null;
  created_at: string;
  assigned_at: string | null;
}
