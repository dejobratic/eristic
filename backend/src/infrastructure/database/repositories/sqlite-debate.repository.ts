import { randomUUID } from 'crypto';

import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';
import { LLMResponse } from '@eristic/app/types/llm.types';

import { DebateRepository, Debate, DebateParticipant, Round } from './debate.repository';

export class SQLiteDebateRepository extends DebateRepository {
  private db = SQLiteConnection.getInstance();

  async createDebate(topic: string, participants: DebateParticipant[]): Promise<Debate> {
    const debateId = randomUUID();
    const now = new Date();
    
    const transaction = this.db.transaction(() => {
      // Insert debate
      const insertDebate = this.db.prepare(`
        INSERT INTO debates (id, topic, status, created_at, updated_at)
        VALUES (?, ?, 'active', ?, ?)
      `);
      insertDebate.run(debateId, topic, now.toISOString(), now.toISOString());
      
      // Insert participants
      const insertParticipant = this.db.prepare(`
        INSERT INTO participants (id, debate_id, type, name, model)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      participants.forEach(participant => {
        insertParticipant.run(
          participant.id,
          debateId,
          participant.type,
          participant.name,
          participant.model || null
        );
      });
    });
    
    transaction();
    
    return {
      id: debateId,
      topic,
      status: 'active',
      participants,
      createdAt: now,
      updatedAt: now
    };
  }

  async getDebate(debateId: string): Promise<Debate | null> {
    const debateQuery = this.db.prepare('SELECT * FROM debates WHERE id = ?');
    const debateRow = debateQuery.get(debateId) as any;
    
    if (!debateRow) return null;
    
    const participantsQuery = this.db.prepare('SELECT * FROM participants WHERE debate_id = ?');
    const participantRows = participantsQuery.all(debateId) as any[];
    
    const participants: DebateParticipant[] = participantRows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      model: row.model
    }));
    
    return {
      id: debateRow.id,
      topic: debateRow.topic,
      status: debateRow.status,
      participants,
      createdAt: new Date(debateRow.created_at),
      updatedAt: new Date(debateRow.updated_at)
    };
  }

  async addResponse(debateId: string, roundNumber: number, response: LLMResponse): Promise<void> {
    const transaction = this.db.transaction(() => {
      // Find or create round
      let roundQuery = this.db.prepare('SELECT id FROM rounds WHERE debate_id = ? AND round_number = ?');
      let roundRow = roundQuery.get(debateId, roundNumber) as any;
      
      let roundId: string;
      if (!roundRow) {
        roundId = randomUUID();
        const insertRound = this.db.prepare(`
          INSERT INTO rounds (id, debate_id, round_number, started_at)
          VALUES (?, ?, ?, ?)
        `);
        insertRound.run(roundId, debateId, roundNumber, new Date().toISOString());
      } else {
        roundId = roundRow.id;
      }
      
      // Add response
      const insertResponse = this.db.prepare(`
        INSERT INTO responses (
          id, round_id, participant_id, content, model, 
          tokens_prompt, tokens_completion, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertResponse.run(
        randomUUID(),
        roundId,
        'llm', // TODO: Get actual participant ID
        response.content,
        response.model,
        response.tokens?.prompt || 0,
        response.tokens?.completion || 0,
        response.timestamp.toISOString()
      );
    });
    
    transaction();
  }

  async getDebateHistory(debateId: string): Promise<Round[]> {
    const roundsQuery = this.db.prepare(`
      SELECT r.*, GROUP_CONCAT(
        json_object(
          'id', res.id,
          'content', res.content,
          'model', res.model,
          'timestamp', res.timestamp,
          'tokens', json_object(
            'prompt', res.tokens_prompt,
            'completion', res.tokens_completion
          )
        )
      ) as responses
      FROM rounds r
      LEFT JOIN responses res ON r.id = res.round_id
      WHERE r.debate_id = ?
      GROUP BY r.id
      ORDER BY r.round_number
    `);
    
    const rows = roundsQuery.all(debateId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      debateId: row.debate_id,
      roundNumber: row.round_number,
      responses: row.responses ? JSON.parse(`[${row.responses}]`) : [],
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }));
  }

  async updateDebateStatus(debateId: string, status: Debate['status']): Promise<void> {
    const query = this.db.prepare(`
      UPDATE debates 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);
    
    query.run(status, new Date().toISOString(), debateId);
  }
}