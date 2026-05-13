import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';

export const whatAreTheChances: GameDefinition = {
  type: 'what_are_the_chances',
  title: 'מה הסיכוי',
  description: 'נחשו את הסיכוי שזה יקרה',
  emoji: '🎲',
  defaultConfig: {},
  stage: makeStage('מה הסיכוי?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
