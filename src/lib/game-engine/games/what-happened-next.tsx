import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';

export const whatHappenedNext: GameDefinition = {
  type: 'what_happened_next',
  title: 'מה קרה אחר כך',
  description: 'מה קרה בסוף? בחרו את ההמשך',
  emoji: '🎬',
  defaultConfig: {},
  stage: makeStage('מה קרה אחר כך?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
