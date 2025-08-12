import { randomUUID } from 'crypto';

import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';
import { Debater } from '@eristic/app/types/debater.types';

import { DebaterRepository } from './debater.repository';

export class SQLiteDebaterRepository extends DebaterRepository {
  private db = SQLiteConnection.getInstance();

  async createDebater(debater: Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debater> {
    const now = new Date();
    const id = randomUUID();

    const insert = this.db.prepare(`
      INSERT INTO debaters (
        id, name, description, model, system_prompt, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      debater.name,
      debater.description,
      debater.model,
      debater.systemPrompt,
      debater.isActive ? 1 : 0,
      now.toISOString(),
      now.toISOString()
    );

    return {
      ...debater,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  async getDebater(id: string): Promise<Debater | null> {
    const query = this.db.prepare('SELECT * FROM debaters WHERE id = ?');
    const row = query.get(id) as any;
    
    if (!row) return null;

    return this.mapRowToDebater(row);
  }

  async getDebaterByName(name: string): Promise<Debater | null> {
    const query = this.db.prepare('SELECT * FROM debaters WHERE name = ?');
    const row = query.get(name) as any;
    
    if (!row) return null;

    return this.mapRowToDebater(row);
  }

  async getAllDebaters(): Promise<Debater[]> {
    const query = this.db.prepare('SELECT * FROM debaters ORDER BY created_at ASC');
    const rows = query.all() as any[];
    
    return rows.map(row => this.mapRowToDebater(row));
  }

  async getActiveDebaters(): Promise<Debater[]> {
    const query = this.db.prepare('SELECT * FROM debaters WHERE is_active = 1 ORDER BY created_at ASC');
    const rows = query.all() as any[];
    
    return rows.map(row => this.mapRowToDebater(row));
  }

  async updateDebater(id: string, updates: Partial<Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Debater | null> {
    const now = new Date();
    
    // Build dynamic update query based on provided updates
    const updateFields = [];
    const updateValues = [];
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.model !== undefined) {
      updateFields.push('model = ?');
      updateValues.push(updates.model);
    }
    if (updates.systemPrompt !== undefined) {
      updateFields.push('system_prompt = ?');
      updateValues.push(updates.systemPrompt);
    }
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.isActive ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      // No updates provided, return current debater
      return this.getDebater(id);
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(now.toISOString());
    updateValues.push(id);
    
    const updateQuery = this.db.prepare(`
      UPDATE debaters 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);
    
    const result = updateQuery.run(...updateValues);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.getDebater(id);
  }

  async deleteDebater(id: string): Promise<void> {
    const query = this.db.prepare('DELETE FROM debaters WHERE id = ?');
    query.run(id);
  }

  private mapRowToDebater(row: any): Debater {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      model: row.model,
      systemPrompt: row.system_prompt,
      isActive: row.is_active === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}