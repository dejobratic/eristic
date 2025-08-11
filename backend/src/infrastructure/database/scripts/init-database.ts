import { MigrationRunner } from '@eristic/infrastructure/database/migrations/migration-runner';
import { SQLiteConnection } from '@eristic/infrastructure/database/connection/sqlite-connection';

export async function initializeDatabase(): Promise<void> {
  console.log('🚀 Initializing Eristic database...');
  
  try {
    // Ensure database connection is established
    const db = SQLiteConnection.getInstance();
    console.log('📁 Database connection established');
    
    // Run all pending migrations
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();
    
    console.log('✅ Database initialization completed successfully');
    
  } catch (error) {
    console.error('💥 Database initialization failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database ready for use');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}