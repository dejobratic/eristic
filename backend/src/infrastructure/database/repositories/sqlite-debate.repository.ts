import { randomUUID } from 'crypto';
import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';
import { DebateRepository } from '@eristic/infrastructure/database/repositories/debate.repository';
import { Debate, DebateParticipant, DebateRound, DebateResponse, DebateWithDetails, CreateDebateRequest, DebateSettings } from '@eristic/app/types/debate.types';
import { ValidationException, NotFoundException } from '@eristic/app/types/exceptions.types';

export class SQLiteDebateRepository extends DebateRepository {
  private db = SQLiteConnection.getInstance();

  async initialize(): Promise<void> {
    // Tables are created via migrations
  }

  async close(): Promise<void> {
    this.db.close();
  }

  // Debate management
  async createDebate(request: CreateDebateRequest): Promise<Debate> {
    const debateId = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO debates (id, topic, status, moderator_id, total_rounds, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        debateId,
        request.topic,
        'active',
        request.moderatorId,
        request.settings.numRounds,
        JSON.stringify(request.settings),
        now,
        now
      );

      // Add participants
      const participants = request.participantIds.map((debaterId, index) => ({
        debaterId,
        position: index + 1,
        role: 'debater' as const
      }));

      await this.addParticipants(debateId, participants);

      const debate = await this.getDebate(debateId);
      if (!debate) {
        throw new Error('Failed to retrieve created debate');
      }

      return debate;
    } catch (error) {
      throw new ValidationException(`Failed to create debate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDebate(debateId: string): Promise<Debate | null> {
    const stmt = this.db.prepare(`
      SELECT id, topic, status, moderator_id as moderatorId, current_round as currentRound, 
             total_rounds as totalRounds, settings, created_at as createdAt, updated_at as updatedAt
      FROM debates WHERE id = ?
    `);

    const row = stmt.get(debateId) as any;
    if (!row) return null;

    return {
      id: row.id,
      topic: row.topic,
      status: row.status,
      moderatorId: row.moderatorId,
      currentRound: row.currentRound,
      totalRounds: row.totalRounds,
      settings: JSON.parse(row.settings) as DebateSettings,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async getDebateWithDetails(debateId: string): Promise<DebateWithDetails | null> {
    const debate = await this.getDebate(debateId);
    if (!debate) return null;

    const participants = await this.getParticipants(debateId);
    const rounds = await this.getRounds(debateId);
    
    // Get current round responses if there's an active round
    let currentRoundResponses: DebateResponse[] = [];
    if (debate.currentRound <= debate.totalRounds) {
      currentRoundResponses = await this.getRoundResponses(debateId, debate.currentRound);
    }

    return {
      ...debate,
      participants,
      rounds,
      currentRoundResponses
    };
  }

  async getAllDebates(): Promise<Debate[]> {
    const stmt = this.db.prepare(`
      SELECT id, topic, status, moderator_id as moderatorId, current_round as currentRound,
             total_rounds as totalRounds, settings, created_at as createdAt, updated_at as updatedAt
      FROM debates ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      topic: row.topic,
      status: row.status,
      moderatorId: row.moderatorId,
      currentRound: row.currentRound,
      totalRounds: row.totalRounds,
      settings: JSON.parse(row.settings) as DebateSettings,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  async updateDebateStatus(debateId: string, status: Debate['status']): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE debates SET status = ?, updated_at = ? WHERE id = ?
    `);

    const result = stmt.run(status, new Date().toISOString(), debateId);
    if (result.changes === 0) {
      throw new NotFoundException('Debate');
    }
  }

  async updateCurrentRound(debateId: string, roundNumber: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE debates SET current_round = ?, updated_at = ? WHERE id = ?
    `);

    const result = stmt.run(roundNumber, new Date().toISOString(), debateId);
    if (result.changes === 0) {
      throw new NotFoundException('Debate');
    }
  }

  async deleteDebate(debateId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM debates WHERE id = ?');
    const result = stmt.run(debateId);
    if (result.changes === 0) {
      throw new NotFoundException('Debate');
    }
  }

  // Participant management
  async addParticipants(debateId: string, participants: Omit<DebateParticipant, 'id' | 'debateId'>[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO debate_participants (id, debate_id, debater_id, position, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((participants: Omit<DebateParticipant, 'id' | 'debateId'>[]) => {
      for (const participant of participants) {
        stmt.run(randomUUID(), debateId, participant.debaterId, participant.position, participant.role);
      }
    });

    transaction(participants);
  }

  async getParticipants(debateId: string): Promise<DebateParticipant[]> {
    const stmt = this.db.prepare(`
      SELECT id, debate_id as debateId, debater_id as debaterId, position, role
      FROM debate_participants WHERE debate_id = ? ORDER BY position
    `);

    return stmt.all(debateId) as DebateParticipant[];
  }

  async removeParticipant(debateId: string, debaterId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM debate_participants WHERE debate_id = ? AND debater_id = ?
    `);

    const result = stmt.run(debateId, debaterId);
    if (result.changes === 0) {
      throw new NotFoundException('Debate participant');
    }
  }

  // Round management
  async createRound(debateId: string, roundNumber: number): Promise<DebateRound> {
    const roundId = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO debate_rounds (id, debate_id, round_number, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(roundId, debateId, roundNumber, 'pending', now, now);

    const round = await this.getRound(roundId);
    if (!round) {
      throw new Error('Failed to retrieve created round');
    }

    return round;
  }

  async getRound(roundId: string): Promise<DebateRound | null> {
    const stmt = this.db.prepare(`
      SELECT id, debate_id as debateId, round_number as roundNumber, 
             moderation_summary as moderationSummary, status,
             created_at as createdAt, updated_at as updatedAt
      FROM debate_rounds WHERE id = ?
    `);

    const row = stmt.get(roundId) as any;
    if (!row) return null;

    return {
      id: row.id,
      debateId: row.debateId,
      roundNumber: row.roundNumber,
      moderationSummary: row.moderationSummary,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async getRoundByNumber(debateId: string, roundNumber: number): Promise<DebateRound | null> {
    const stmt = this.db.prepare(`
      SELECT id, debate_id as debateId, round_number as roundNumber,
             moderation_summary as moderationSummary, status,
             created_at as createdAt, updated_at as updatedAt
      FROM debate_rounds WHERE debate_id = ? AND round_number = ?
    `);

    const row = stmt.get(debateId, roundNumber) as any;
    if (!row) return null;

    return {
      id: row.id,
      debateId: row.debateId,
      roundNumber: row.roundNumber,
      moderationSummary: row.moderationSummary,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateRoundSummary(roundId: string, summary: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE debate_rounds SET moderation_summary = ?, updated_at = ? WHERE id = ?
    `);

    const result = stmt.run(summary, new Date().toISOString(), roundId);
    if (result.changes === 0) {
      throw new NotFoundException('Round');
    }
  }

  async updateRoundStatus(roundId: string, status: DebateRound['status']): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE debate_rounds SET status = ?, updated_at = ? WHERE id = ?
    `);

    const result = stmt.run(status, new Date().toISOString(), roundId);
    if (result.changes === 0) {
      throw new NotFoundException('Round');
    }
  }

  async getRounds(debateId: string): Promise<DebateRound[]> {
    const stmt = this.db.prepare(`
      SELECT id, debate_id as debateId, round_number as roundNumber,
             moderation_summary as moderationSummary, status,
             created_at as createdAt, updated_at as updatedAt
      FROM debate_rounds WHERE debate_id = ? ORDER BY round_number
    `);

    const rows = stmt.all(debateId) as any[];
    return rows.map(row => ({
      id: row.id,
      debateId: row.debateId,
      roundNumber: row.roundNumber,
      moderationSummary: row.moderationSummary,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  // Response management
  async addResponse(response: Omit<DebateResponse, 'id' | 'timestamp'>): Promise<DebateResponse> {
    const responseId = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO debate_responses (id, round_id, debater_id, content, response_order, model, 
                                  tokens_prompt, tokens_completion, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      responseId,
      response.roundId,
      response.debaterId,
      response.content,
      response.responseOrder,
      response.model || null,
      response.tokens?.prompt || null,
      response.tokens?.completion || null,
      now
    );

    return {
      id: responseId,
      ...response,
      timestamp: new Date(now)
    };
  }

  async getResponses(roundId: string): Promise<DebateResponse[]> {
    const stmt = this.db.prepare(`
      SELECT id, round_id as roundId, debater_id as debaterId, content, response_order as responseOrder,
             model, tokens_prompt, tokens_completion, timestamp
      FROM debate_responses WHERE round_id = ? ORDER BY response_order
    `);

    const rows = stmt.all(roundId) as any[];
    return rows.map(row => ({
      id: row.id,
      roundId: row.roundId,
      debaterId: row.debaterId,
      content: row.content,
      responseOrder: row.responseOrder,
      model: row.model,
      tokens: row.tokens_prompt && row.tokens_completion ? {
        prompt: row.tokens_prompt,
        completion: row.tokens_completion,
        total: row.tokens_prompt + row.tokens_completion
      } : undefined,
      timestamp: new Date(row.timestamp)
    }));
  }

  async getRoundResponses(debateId: string, roundNumber: number): Promise<DebateResponse[]> {
    const stmt = this.db.prepare(`
      SELECT dr.id, dr.round_id as roundId, dr.debater_id as debaterId, dr.content, 
             dr.response_order as responseOrder, dr.model, dr.tokens_prompt, dr.tokens_completion, dr.timestamp
      FROM debate_responses dr
      JOIN debate_rounds r ON dr.round_id = r.id
      WHERE r.debate_id = ? AND r.round_number = ?
      ORDER BY dr.response_order
    `);

    const rows = stmt.all(debateId, roundNumber) as any[];
    return rows.map(row => ({
      id: row.id,
      roundId: row.roundId,
      debaterId: row.debaterId,
      content: row.content,
      responseOrder: row.responseOrder,
      model: row.model,
      tokens: row.tokens_prompt && row.tokens_completion ? {
        prompt: row.tokens_prompt,
        completion: row.tokens_completion,
        total: row.tokens_prompt + row.tokens_completion
      } : undefined,
      timestamp: new Date(row.timestamp)
    }));
  }

  async getAllDebateResponses(debateId: string): Promise<DebateResponse[]> {
    const stmt = this.db.prepare(`
      SELECT dr.id, dr.round_id as roundId, dr.debater_id as debaterId, dr.content,
             dr.response_order as responseOrder, dr.model, dr.tokens_prompt, dr.tokens_completion, dr.timestamp,
             r.round_number as roundNumber
      FROM debate_responses dr
      JOIN debate_rounds r ON dr.round_id = r.id
      WHERE r.debate_id = ?
      ORDER BY r.round_number, dr.response_order
    `);

    const rows = stmt.all(debateId) as any[];
    return rows.map(row => ({
      id: row.id,
      roundId: row.roundId,
      debaterId: row.debaterId,
      content: row.content,
      responseOrder: row.responseOrder,
      model: row.model,
      tokens: row.tokens_prompt && row.tokens_completion ? {
        prompt: row.tokens_prompt,
        completion: row.tokens_completion,
        total: row.tokens_prompt + row.tokens_completion
      } : undefined,
      timestamp: new Date(row.timestamp)
    }));
  }
}