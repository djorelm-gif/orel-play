import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';
import { GAME_SPECS } from '../specs';

export const whatAreTheChances: GameDefinition = {
  type: 'what_are_the_chances',
  title: 'מה הסיכוי',
  description: 'נחשו את הסיכוי שזה יקרה',
  emoji: '🎲',
  defaultConfig: {},
  aiSpec: GAME_SPECS.what_are_the_chances,
  stage: makeStage('מה הסיכוי?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
