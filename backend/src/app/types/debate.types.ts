// Multi-debate system types
import { LLMResponse } from '@eristic/app/types/llm.types';

export interface Debate {
  id: string;
  topic: string;
  status: 'active' | 'completed' | 'paused';
  moderatorId: string;
  currentRound: number;
  totalRounds: number;
  settings: DebateSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebateParticipant {
  id: string;
  debateId: string;
  debaterId: string;
  position: number; // Turn order (1, 2, 3...)
  role: 'debater' | 'moderator';
}

export interface DebateRound {
  id: string;
  debateId: string;
  roundNumber: number;
  moderationSummary?: string; // Summary from moderator
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DebateResponse {
  id: string;
  roundId: string;
  debaterId: string;
  content: string;
  responseOrder: number; // Order within the round
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  timestamp: Date;
}

export interface DebateSettings {
  numDebaters: number; // 2-5
  numRounds: number;   // 1-10
  turnOrder: 'fixed' | 'random' | 'moderator-selected';
  responseTimeout?: number; // Minutes
  maxResponseLength?: number; // Characters
}

export interface CreateDebateRequest {
  topic: string;
  participantIds: string[]; // Array of debater IDs
  moderatorId: string;
  settings: DebateSettings;
}

export interface DebateWithDetails extends Debate {
  participants: DebateParticipant[];
  rounds: DebateRound[];
  currentRoundResponses?: DebateResponse[];
}

export interface UserSettings {
  id: string;
  debateSettings: DebateSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Default settings
export const DEFAULT_DEBATE_SETTINGS: DebateSettings = {
  numDebaters: 2,
  numRounds: 3,
  turnOrder: 'fixed',
  responseTimeout: 5, // 5 minutes
  maxResponseLength: 2000 // 2000 characters
};