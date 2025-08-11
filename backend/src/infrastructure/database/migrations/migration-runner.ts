import fs from 'fs';
import path from 'path';

import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';

export interface Migration {
  id: string;
  name: string;
  content: string;
}

export class MigrationRunner {
  private db = SQLiteConnection.getInstance();

  async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.getAvailableMigrations();
    
    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.includes(migration.id)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations found');
      return;
    }

    console.log(`📝 Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }
    
    console.log('✅ All migrations completed successfully');
  }

  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const query = this.db.prepare('SELECT id FROM migrations ORDER BY applied_at');
      const results = query.all() as { id: string }[];
      return results.map(row => row.id);
    } catch (error) {
      // If migrations table doesn't exist, no migrations have been applied
      return [];
    }
  }

  private async getAvailableMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => {
      const id = file.split('_')[0];
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      
      return {
        id,
        name: file,
        content
      };
    });
  }

  private async applyMigration(migration: Migration): Promise<void> {
    console.log(`📝 Applying migration: ${migration.name}`);
    
    try {
      // Execute migration in a transaction
      const transaction = this.db.transaction(() => {
        this.db.exec(migration.content);
      });
      
      transaction();
      console.log(`✅ Migration ${migration.name} applied successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration.name}:`, error);
      throw error;
    }
  }

  async rollbackLastMigration(): Promise<void> {
    // Future enhancement: Add rollback functionality
    throw new Error('Rollback functionality not implemented yet');
  }

  async getMigrationStatus(): Promise<{ applied: string[], pending: string[] }> {
    const applied = await this.getAppliedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available
      .filter(migration => !applied.includes(migration.id))
      .map(migration => migration.name);

    return { applied, pending };
  }
}

// CLI execution
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runMigrations()
    .then(() => {
      console.log('🎉 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}