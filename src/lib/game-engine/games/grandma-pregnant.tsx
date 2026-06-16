import type { GameDefinition } from '../types';
import { makePartyStage, makePartyPlayer, makePartyHost } from './party-host-led-shared';
import { GAME_SPECS } from '../specs';

const cfg = {
  emoji: '👵',
  title: 'סבתא בהריון',
  tagline: 'מה סבתא רוצה לאכול? כל אחד מוסיף — מי יזכור את כל הרשימה?',
  rules: [
    'הראשון מתחיל: "סבתא בהריון והיא רוצה לאכול ___" (פריט אחד).',
    'הבא בתור חוזר על כל הרשימה ומוסיף פריט משלו.',
    'מי ששוכח פריט, מבלבל את הסדר, או מתעכב יותר מ-5 שניות — יוצא.',
    'הסיבוב מתחיל מחדש עם השחקנים שנשארו. האחרון/ה — מנצח/ת.',
  ],
  playerNote: 'תקשיבו ותזכרו! גם אם לא במשחק — אפשר לעזור לחבר שעל הבמה.',
  hostNotes: [
    '4-8 שחקנים זה גודל נוח.',
    'אם רוצים יותר אתגר: חייבים מאכל בעברית בלי חזרות.',
    'אפשר גרסה: "סבתא בהריון והיא רוצה לטוס ל___" (יעדים במקום אוכל).',
  ],
};

export const grandmaPregnant: GameDefinition = {
  type: 'grandma_pregnant',
  title: 'סבתא בהריון',
  description: 'משחק זיכרון אינסופי — מה סבתא רוצה לאכול',
  emoji: '👵',
  defaultConfig: {},
  aiSpec: GAME_SPECS.grandma_pregnant,
  stage: makePartyStage(cfg),
  player: makePartyPlayer(cfg),
  hostControls: makePartyHost(cfg),
};
