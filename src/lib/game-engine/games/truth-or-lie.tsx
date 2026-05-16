import type { GameDefinition } from '../types';
import { makeStage, makePlayer, makeHost } from './multi-choice-shared';
import { GAME_SPECS } from '../specs';

export const truthOrLie: GameDefinition = {
  type: 'truth_or_lie',
  title: 'אמת או שקר',
  description: 'סיפור דרמטי — אמת או שקר?',
  emoji: '🎭',
  defaultConfig: {},
  aiSpec: GAME_SPECS.truth_or_lie,
  stage: makeStage('אמת או שקר?'),
  player: makePlayer(),
  hostControls: makeHost(),
};
