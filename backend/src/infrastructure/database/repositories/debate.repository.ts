import { Debate, DebateParticipant, DebateRound, DebateResponse, DebateWithDetails, CreateDebateRequest } from '@eristic/app/types/debate.types';

// Abstract repository interface for multi-debate system
export abstract class DebateRepository {
  // Debate management
  abstract createDebate(request: CreateDebateRequest): Promise<Debate>;
  abstract getDebate(debateId: string): Promise<Debate | null>;
  abstract getDebateWithDetails(debateId: string): Promise<DebateWithDetails | null>;
  abstract getAllDebates(): Promise<Debate[]>;
  abstract updateDebateStatus(debateId: string, status: Debate['status']): Promise<void>;
  abstract updateCurrentRound(debateId: string, roundNumber: number): Promise<void>;
  abstract deleteDebate(debateId: string): Promise<void>;

  // Participant management
  abstract addParticipants(debateId: string, participants: Omit<DebateParticipant, 'id' | 'debateId'>[]): Promise<void>;
  abstract getParticipants(debateId: string): Promise<DebateParticipant[]>;
  abstract removeParticipant(debateId: string, debaterId: string): Promise<void>;

  // Round management
  abstract createRound(debateId: string, roundNumber: number): Promise<DebateRound>;
  abstract getRound(roundId: string): Promise<DebateRound | null>;
  abstract getRoundByNumber(debateId: string, roundNumber: number): Promise<DebateRound | null>;
  abstract updateRoundSummary(roundId: string, summary: string): Promise<void>;
  abstract updateRoundStatus(roundId: string, status: DebateRound['status']): Promise<void>;
  abstract getRounds(debateId: string): Promise<DebateRound[]>;

  // Response management
  abstract addResponse(response: Omit<DebateResponse, 'id' | 'timestamp'>): Promise<DebateResponse>;
  abstract getResponses(roundId: string): Promise<DebateResponse[]>;
  abstract getRoundResponses(debateId: string, roundNumber: number): Promise<DebateResponse[]>;
  abstract getAllDebateResponses(debateId: string): Promise<DebateResponse[]>;

  // Database lifecycle
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
}