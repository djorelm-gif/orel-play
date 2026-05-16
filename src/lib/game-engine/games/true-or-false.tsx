import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';
import { GAME_SPECS } from '../specs';

export const trueOrFalse: GameDefinition = {
  type: 'true_or_false',
  title: 'נכון או לא נכון',
  description: 'תשובות מהירות — נכון או לא נכון',
  emoji: '⚡',
  defaultConfig: {},
  aiSpec: GAME_SPECS.true_or_false,
  stage: makeStage('נכון או לא נכון?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
