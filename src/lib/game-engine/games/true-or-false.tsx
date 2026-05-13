import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';

export const trueOrFalse: GameDefinition = {
  type: 'true_or_false',
  title: 'נכון או לא נכון',
  description: 'תשובות מהירות — נכון או לא נכון',
  emoji: '⚡',
  defaultConfig: {},
  stage: makeStage('נכון או לא נכון?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
