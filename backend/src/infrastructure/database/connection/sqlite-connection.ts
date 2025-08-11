import Database from 'better-sqlite3';
import path from 'path';

export class SQLiteConnection {
  private static instance: Database.Database | null = null;
  private static readonly DB_PATHS = {
    development: './database/eristic-dev.db',
    test: './database/eristic-test.db',
    production: './database/eristic.db'
  };

  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = this.createConnection();
    }
    return this.instance;
  }

  private static createConnection(): Database.Database {
    const environment = process.env.NODE_ENV || 'development';
    const dbPath = this.DB_PATHS[environment as keyof typeof this.DB_PATHS] || this.DB_PATHS.development;
    
    console.log(`📁 Connecting to SQLite database: ${dbPath} (${environment})`);
    
    const db = new Database(dbPath);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Set journal mode to WAL for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Enable synchronous mode for durability
    db.pragma('synchronous = NORMAL');
    
    return db;
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      console.log('📁 SQLite connection closed');
    }
  }

  static getDatabasePath(): string {
    const environment = process.env.NODE_ENV || 'development';
    return this.DB_PATHS[environment as keyof typeof this.DB_PATHS] || this.DB_PATHS.development;
  }

  static async backup(backupPath?: string): Promise<string> {
    const db = this.getInstance();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupPath = `./database/backups/eristic-backup-${timestamp}.db`;
    const finalBackupPath = backupPath || defaultBackupPath;
    
    await db.backup(finalBackupPath);
    console.log(`📁 Database backed up to: ${finalBackupPath}`);
    
    return finalBackupPath;
  }
}