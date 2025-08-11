import { randomUUID } from 'crypto';

import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';
import { LLMResponse } from '@eristic/app/types/llm.types';

import { TopicRepository, TopicItem } from './topic.repository';

export class SQLiteTopicRepository extends TopicRepository {
  private db = SQLiteConnection.getInstance();

  async saveTopic(name: string, response: LLMResponse): Promise<void> {
    const now = new Date();
    
    const upsert = this.db.prepare(`
      INSERT INTO topics (
        id, name, llm_response, model, timestamp, 
        tokens_prompt, tokens_completion, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        llm_response = excluded.llm_response,
        model = excluded.model,
        timestamp = excluded.timestamp,
        tokens_prompt = excluded.tokens_prompt,
        tokens_completion = excluded.tokens_completion,
        updated_at = excluded.updated_at
    `);

    upsert.run(
      randomUUID(),
      name,
      JSON.stringify(response),
      response.model,
      response.timestamp.toISOString(),
      response.tokens?.prompt || 0,
      response.tokens?.completion || 0,
      now.toISOString(),
      now.toISOString()
    );
  }

  async getTopic(name: string): Promise<TopicItem | null> {
    const query = this.db.prepare('SELECT * FROM topics WHERE name = ?');
    const row = query.get(name) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      llmResponse: row.llm_response ? JSON.parse(row.llm_response) : undefined,
      timestamp: new Date(row.timestamp || row.created_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async getAllTopics(): Promise<TopicItem[]> {
    const query = this.db.prepare('SELECT * FROM topics ORDER BY updated_at DESC');
    const rows = query.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      llmResponse: row.llm_response ? JSON.parse(row.llm_response) : undefined,
      timestamp: new Date(row.timestamp || row.created_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  async deleteTopic(name: string): Promise<void> {
    const query = this.db.prepare('DELETE FROM topics WHERE name = ?');
    query.run(name);
  }
}