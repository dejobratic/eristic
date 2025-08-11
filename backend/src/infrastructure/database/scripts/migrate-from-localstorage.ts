import { SQLiteTopicRepository } from '@eristic/infrastructure/database/repositories/sqlite-topic.repository';
import { DatabaseConnectionManager } from '@eristic/infrastructure/database/connection/connection-manager';
import { LLMResponse } from '@eristic/app/types/llm.types';

interface LocalStorageTopicItem {
  name: string;
  timestamp: string;
  llmResponse?: LLMResponse;
  hasRequestedLLMResponse?: boolean;
}

export async function migrateFromLocalStorage(localStorageData: string): Promise<void> {
  console.log('🔄 Starting localStorage to SQLite migration...');
  
  try {
    const connectionManager = DatabaseConnectionManager.getInstance();
    await connectionManager.initialize();
    
    const repository = new SQLiteTopicRepository();
    
    // Parse localStorage data
    const topics: LocalStorageTopicItem[] = JSON.parse(localStorageData);
    console.log(`📊 Found ${topics.length} topics in localStorage`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const topic of topics) {
      try {
        // Check if topic already exists in database
        const existingTopic = await repository.getTopic(topic.name);
        
        if (existingTopic) {
          console.log(`⏭️  Skipping existing topic: ${topic.name}`);
          skippedCount++;
          continue;
        }
        
        // Migrate topic with LLM response if it exists
        if (topic.llmResponse) {
          // Ensure timestamp is a Date object
          const response: LLMResponse = {
            ...topic.llmResponse,
            timestamp: new Date(topic.llmResponse.timestamp)
          };
          
          await repository.saveTopic(topic.name, response);
          console.log(`✅ Migrated topic with response: ${topic.name}`);
        }
        // Note: hasRequestedLLMResponse is no longer needed
        
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to migrate topic ${topic.name}:`, error);
      }
    }
    
    console.log(`✅ Migration completed:`);
    console.log(`  - Migrated: ${migratedCount} topics`);
    console.log(`  - Skipped: ${skippedCount} topics`);
    console.log(`  - Total: ${topics.length} topics processed`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

export async function migrateFromLocalStorageFile(filePath: string): Promise<void> {
  const fs = require('fs');
  
  if (!fs.existsSync(filePath)) {
    console.log(`📄 localStorage file not found: ${filePath}`);
    console.log('ℹ️  No migration needed - starting fresh');
    return;
  }
  
  const data = fs.readFileSync(filePath, 'utf-8');
  await migrateFromLocalStorage(data);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage: npm run db:migrate-localstorage [localStorage-data-file.json]');
    console.log('📋 Example: npm run db:migrate-localstorage ./data/topic-history.json');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  migrateFromLocalStorageFile(filePath)
    .then(() => {
      console.log('🎉 localStorage migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 localStorage migration failed:', error);
      process.exit(1);
    });
}