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

// AI-generation brief for a single game. The GPT generator builds its prompt
// by stitching these briefs together, so each game gets a tailored instruction
// instead of a generic "make questions" ask. Host-readable so a producer can
// look up exactly what each game does and how it shows up.
export interface GameAISpec {
  // Plain-Hebrew purpose, e.g. "הקהל מנחש אם משפט על החוגג/ת נכון".
  purpose: string;
  // Target count of items to generate (the model may produce ±2).
  questionCount: number;
  // Instructions block — paste exactly into the prompt. Should describe the
  // kind of content wanted, with concrete do/don't examples in Hebrew.
  instructions: string;
  // How the question presents on the TV/stage screen. Used in the host's
  // game-builder so they understand what they're configuring; the LLM also
  // sees this so it knows the visual constraints (length, line count).
  stageDisplay: string;
  // How the question presents on the player's phone.
  playerDisplay: string;
}

export interface GameDefinition {
  type: GameType;
  title: string;
  description: string;
  emoji: string;
  defaultConfig: Record<string, unknown>;
  // AI brief — referenced by the GPT generator and shown in the admin builder.
  aiSpec: GameAISpec;
  stage: ComponentType<StageProps>;
  player: ComponentType<PlayerProps>;
  hostControls: ComponentType<HostControlsProps>;
}
