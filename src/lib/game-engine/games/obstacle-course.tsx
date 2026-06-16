import type { GameDefinition } from '../types';
import { makePartyStage, makePartyPlayer, makePartyHost } from './party-host-led-shared';
import { GAME_SPECS } from '../specs';

const cfg = {
  emoji: '🏁',
  title: 'מסלול מכשולים',
  tagline: 'מסלול אתגרים פיזי באולם — מי הראשון/ה לסיים?',
  rules: [
    'המנחה מסמן/ת 4-6 תחנות בשטח האולם.',
    'כל מתחרה צריך/ה לעבור את כולן בסדר: לרוץ סביב כיסא, לעשות 3 קפיצות, להחזיק תפוח על הראש 10 שניות, וכו׳.',
    '2-4 שחקנים מתחרים במקביל. הראשון/ה לחזור — מנצח/ת.',
    'אם פלת תחנה — חוזרים אליה ומשלימים. אסור לרמות!',
  ],
  playerNote: 'מי שלא במשחק — מעודדים! מי שעל הבמה — בהצלחה 💪',
  hostNotes: [
    'בחר/י תחנות שתואמות לאולם — בטיחות קודם.',
    'הכן 2-4 קבוצות של מתחרים מראש (מהמתנדבים).',
    'אפשר לשלב תחנה מצחיקה: לרקוד 5 שניות, לחקות בעל חיים.',
  ],
};

export const obstacleCourse: GameDefinition = {
  type: 'obstacle_course',
  title: 'מסלול מכשולים',
  description: 'מסלול אתגרים פיזי באולם — מי הראשון/ה?',
  emoji: '🏁',
  defaultConfig: {},
  aiSpec: GAME_SPECS.obstacle_course,
  stage: makePartyStage(cfg),
  player: makePartyPlayer(cfg),
  hostControls: makePartyHost(cfg),
};
