import type { GameType } from '@/types/game';
import type { GameDefinition } from './types';
import { secretMission } from './games/secret-mission';
import { whatAreTheChances } from './games/what-are-the-chances';
import { whatHappenedNext } from './games/what-happened-next';
import { trueOrFalse } from './games/true-or-false';
import { musicalChairs } from './games/musical-chairs';
import { truthOrLie } from './games/truth-or-lie';

const registry: Record<GameType, GameDefinition> = {
  secret_mission: secretMission,
  what_are_the_chances: whatAreTheChances,
  what_happened_next: whatHappenedNext,
  true_or_false: trueOrFalse,
  musical_chairs: musicalChairs,
  truth_or_lie: truthOrLie,
};

export function getGameDefinition(type: GameType): GameDefinition {
  return registry[type];
}

export const allGames = Object.values(registry);
