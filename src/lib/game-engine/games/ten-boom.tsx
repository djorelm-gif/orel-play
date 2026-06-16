import type { GameDefinition } from '../types';
import { makePartyStage, makePartyPlayer, makePartyHost } from './party-host-led-shared';
import { GAME_SPECS } from '../specs';

const cfg = {
  emoji: '💣',
  title: '10 בום',
  tagline: 'סופרים יחד — וצועקים "בום!" במקום מספרים מסוכנים',
  rules: [
    'יושבים במעגל ומתחילים לספור: 1, 2, 3...',
    'במקום כל מספר שמתחלק ב-7 או מכיל את הספרה 7 — אומרים "בום".',
    'מי שטעה, היסס, או אמר את המספר במקום "בום" — יוצא.',
    'הסיבוב הבא מתחיל מ-1. השחקן האחרון שנשאר — מנצח.',
  ],
  playerNote: 'הקשיבו טוב למספרים. רוצים לעלות לבמה? תרימו יד.',
  hostNotes: [
    'בחר/י קבוצה של 6-10 שחקנים שירצו להשתתף.',
    'אפשר להחליף את המספר 7 ל-3 אם הקבוצה גדולה.',
    'בקש מקהל לעודד כל "בום" מוצלח.',
  ],
};

export const tenBoom: GameDefinition = {
  type: 'ten_boom',
  title: '10 בום',
  description: 'סופרים — וצועקים בום במקום מספרים מסוכנים',
  emoji: '💣',
  defaultConfig: {},
  aiSpec: GAME_SPECS.ten_boom,
  stage: makePartyStage(cfg),
  player: makePartyPlayer(cfg),
  hostControls: makePartyHost(cfg),
};
