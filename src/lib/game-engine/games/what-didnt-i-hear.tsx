import type { GameDefinition } from '../types';
import { makePartyStage, makePartyPlayer, makePartyHost } from './party-host-led-shared';
import { GAME_SPECS } from '../specs';

const cfg = {
  emoji: '🙈',
  title: 'מה לא שמעתי',
  tagline: 'שחקן יוצא, הקהל ממציא — מה בסיפור לא היה שם?',
  rules: [
    'בוחרים שחקן/ית שיוצא/ת מהאולם.',
    'המנחה מקריא/ה סיפור קצר על החוגג/ת — 4-5 משפטים אמיתיים.',
    'הקהל יחד מוסיף *משפט שקרי אחד* לסיפור.',
    'השחקן/ית חוזר/ת, שומע/ת את הסיפור, וצריך/ה לזהות איזה משפט הוא שקר.',
    'מצליחים — נקודה. נכשלים — הקהל מנצח את הסיבוב.',
  ],
  playerNote: 'אתם בקהל שמכריע — מסתודדים, בוחרים את השקר, ולא חושפים!',
  hostNotes: [
    'בחר/י שחקן 1 לכל סיבוב. סבב על 3 שחקנים שונים.',
    'הסיפורים יכולים לבוא מהפרופיל של החוגג/ת (האשף).',
    'אם הקהל מתקשה להחליט — הצע 3 שקרים אפשריים והם בוחרים.',
  ],
};

export const whatDidntIHear: GameDefinition = {
  type: 'what_didnt_i_hear',
  title: 'מה לא שמעתי',
  description: 'שחקן יוצא, הקהל ממציא — מה לא נאמר?',
  emoji: '🙈',
  defaultConfig: {},
  aiSpec: GAME_SPECS.what_didnt_i_hear,
  stage: makePartyStage(cfg),
  player: makePartyPlayer(cfg),
  hostControls: makePartyHost(cfg),
};
