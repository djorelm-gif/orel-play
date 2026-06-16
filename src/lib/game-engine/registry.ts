import type { GameType } from '@/types/game';
import type { GameDefinition } from './types';
import { secretMission } from './games/secret-mission';
import { whatAreTheChances } from './games/what-are-the-chances';
import { whatHappenedNext } from './games/what-happened-next';
import { trueOrFalse } from './games/true-or-false';
import { musicalChairs } from './games/musical-chairs';
import { truthOrLie } from './games/truth-or-lie';
import { tenBoom } from './games/ten-boom';
import { grandmaPregnant } from './games/grandma-pregnant';
import { whatDidntIHear } from './games/what-didnt-i-hear';
import { oneDay } from './games/one-day';
import { obstacleCourse } from './games/obstacle-course';

const registry: Record<GameType, GameDefinition> = {
  secret_mission: secretMission,
  what_are_the_chances: whatAreTheChances,
  what_happened_next: whatHappenedNext,
  true_or_false: trueOrFalse,
  musical_chairs: musicalChairs,
  truth_or_lie: truthOrLie,
  ten_boom: tenBoom,
  grandma_pregnant: grandmaPregnant,
  what_didnt_i_hear: whatDidntIHear,
  one_day: oneDay,
  obstacle_course: obstacleCourse,
};

export function getGameDefinition(type: GameType): GameDefinition {
  return registry[type];
}

export const allGames = Object.values(registry);
