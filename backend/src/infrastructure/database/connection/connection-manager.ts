import { SQLiteConnection } from './sqlite-connection';

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  
  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('📁 Database connection initialized');
  }

  async close(): Promise<void> {
    SQLiteConnection.close();
    console.log('📁 Database connection closed');
  }

  async backup(): Promise<string> {
    return await SQLiteConnection.backup();
  }
}