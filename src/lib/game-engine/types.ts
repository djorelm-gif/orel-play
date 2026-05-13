import type { ComponentType } from 'react';
import type { GameType, EventGame, GameQuestion, PlayerAnswer, SecretMission } from '@/types/game';
import type { Player } from '@/types/player';
import type { LiveSession } from '@/types/live-session';
import type { OrelEvent } from '@/types/event';

export interface StageProps {
  event: OrelEvent;
  liveSession: LiveSession;
  eventGame: EventGame;
  question: GameQuestion | null;
  answers: PlayerAnswer[];
  players: Player[];
  missions?: SecretMission[];
}

export interface PlayerProps {
  event: OrelEvent;
  liveSession: LiveSession;
  eventGame: EventGame;
  question: GameQuestion | null;
  player: Player;
  hasAnswered: boolean;
  myAnswer?: PlayerAnswer | null;
  myMission?: SecretMission | null;
  submitAnswer: (input: { answer_text: string }) => Promise<void>;
}

export interface HostControlsProps {
  event: OrelEvent;
  liveSession: LiveSession;
  eventGame: EventGame;
  questions: GameQuestion[];
  players: Player[];
  answers: PlayerAnswer[];
  missions: SecretMission[];
  refresh?: () => void;
}

export interface GameDefinition {
  type: GameType;
  title: string;
  description: string;
  emoji: string;
  defaultConfig: Record<string, unknown>;
  stage: ComponentType<StageProps>;
  player: ComponentType<PlayerProps>;
  hostControls: ComponentType<HostControlsProps>;
}
