import { LLMResponse } from '@eristic/app/types/llm.types';

export interface DebateParticipant {
  id: string;
  type: 'llm' | 'user';
  name: string;
  model?: string;
}

export interface Debate {
  id: string;
  topic: string;
  status: 'active' | 'completed' | 'paused';
  participants: DebateParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Round {
  id: string;
  debateId: string;
  roundNumber: number;
  responses: LLMResponse[];
  startedAt: Date;
  completedAt?: Date;
}

export abstract class DebateRepository {
  abstract createDebate(topic: string, participants: DebateParticipant[]): Promise<Debate>;
  abstract getDebate(debateId: string): Promise<Debate | null>;
  abstract addResponse(debateId: string, roundNumber: number, response: LLMResponse): Promise<void>;
  abstract getDebateHistory(debateId: string): Promise<Round[]>;
  abstract updateDebateStatus(debateId: string, status: Debate['status']): Promise<void>;
}