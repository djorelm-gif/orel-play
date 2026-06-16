import type { GameDefinition } from '../types';
import { makePartyStage, makePartyPlayer, makePartyHost } from './party-host-led-shared';
import { GAME_SPECS } from '../specs';

const cfg = {
  emoji: '📖',
  title: 'יום מן הימים',
  tagline: 'מתחילים סיפור על החוגג/ת — מילה אחת מכל אחד בתור',
  rules: [
    'יושבים במעגל. המנחה אומר/ת: "יום מן הימים, החוגג/ת..."',
    'כל שחקן/ית בתור מוסיף *מילה אחת* לסיפור.',
    'אסור מילים סתמיות (ו-, כי, אבל בלבד).',
    'מי שמהסס יותר מ-3 שניות, או הורס את הסיפור — יוצא.',
    'הסיפור צריך להישאר הגיוני ומצחיק. המנצח/ת — הסיפור הכי משוגע שזכור לכולם.',
  ],
  playerNote: 'גם אם לא בתור — תקשיבו ותכינו מילים. נקראת בתור — מילה אחת בלבד!',
  hostNotes: [
    'התחל/י עם פתיחה שאסור לסיים — "יום מן הימים, [שם] קמה ואמרה..."',
    'אחרי 30-40 מילים — סובב/י לסיכום משעשע ולחזרה על הסיפור המלא.',
    'אפשר להריץ 2-3 סיבובים עם פתיחות שונות.',
  ],
};

export const oneDay: GameDefinition = {
  type: 'one_day',
  title: 'יום מן הימים',
  description: 'סיפור משותף — מילה אחת בתור',
  emoji: '📖',
  defaultConfig: {},
  aiSpec: GAME_SPECS.one_day,
  stage: makePartyStage(cfg),
  player: makePartyPlayer(cfg),
  hostControls: makePartyHost(cfg),
};
