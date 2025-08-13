import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';
import { SettingsRepository } from '@eristic/infrastructure/database/repositories/settings.repository';
import { UserSettings, DebateSettings, DEFAULT_DEBATE_SETTINGS } from '@eristic/app/types/debate.types';

export class SQLiteSettingsRepository extends SettingsRepository {
  private db = SQLiteConnection.getInstance();

  async getUserSettings(): Promise<UserSettings | null> {
    const stmt = this.db.prepare(`
      SELECT id, debate_settings as debateSettings, created_at as createdAt, updated_at as updatedAt
      FROM user_settings WHERE id = 'default'
    `);

    const row = stmt.get() as any;
    if (!row) return null;

    return {
      id: row.id,
      debateSettings: JSON.parse(row.debateSettings) as DebateSettings,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateDebateSettings(settings: DebateSettings): Promise<void> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_settings (id, debate_settings, created_at, updated_at)
      VALUES ('default', ?, COALESCE((SELECT created_at FROM user_settings WHERE id = 'default'), ?), ?)
    `);

    stmt.run(JSON.stringify(settings), now, now);
  }

  async createDefaultSettings(): Promise<UserSettings> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_settings (id, debate_settings, created_at, updated_at)
      VALUES ('default', ?, ?, ?)
    `);

    stmt.run(JSON.stringify(DEFAULT_DEBATE_SETTINGS), now, now);

    const settings = await this.getUserSettings();
    if (!settings) {
      throw new Error('Failed to create default settings');
    }

    return settings;
  }
}