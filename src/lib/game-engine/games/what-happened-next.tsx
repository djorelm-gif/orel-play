import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';
import { GAME_SPECS } from '../specs';

export const whatHappenedNext: GameDefinition = {
  type: 'what_happened_next',
  title: 'מה קרה אחר כך',
  description: 'מה קרה בסוף? בחרו את ההמשך',
  emoji: '🎬',
  defaultConfig: {},
  aiSpec: GAME_SPECS.what_happened_next,
  stage: makeStage('מה קרה אחר כך?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
