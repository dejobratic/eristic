import 'dotenv/config';

import { SQLiteDebateRepository, SQLiteDebaterRepository, SQLiteSettingsRepository } from '@eristic/infrastructure/database/repositories';
import { DatabaseConnectionManager } from '@eristic/infrastructure/database/connection/connection-manager';
import { initializeDatabase } from '@eristic/infrastructure/database/scripts/init-database';
import { createLLMRoutes } from '@eristic/api/routes/llm.routes';
import { createDebaterRoutes } from '@eristic/api/routes/debater.routes';
import { createDebateRoutes } from '@eristic/api/routes/debate.routes';
import { createSettingsRoutes } from '@eristic/api/routes/settings.routes';
import { errorHandler } from '@eristic/api/middleware/error.middleware';
import { LLMService } from '@eristic/app/services/llm.service';
import { DebateService } from '@eristic/app/services/debate.service';
import { ModeratorService } from '@eristic/app/services/moderator.service';
import { SettingsService } from '@eristic/app/services/settings.service';
import { LLMConfig } from '@eristic/app/types/llm.types';

import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// LLM Configuration
const llmConfig: LLMConfig = {
  provider: process.env.LLM_PROVIDER || 'ollama',
  baseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434',
  model: process.env.LLM_MODEL || 'llama2',
  options: {
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048')
  }
};

// Initialize services
async function initializeServices() {
  // Initialize database
  await initializeDatabase();
  
  // Initialize connection manager
  const connectionManager = DatabaseConnectionManager.getInstance();
  await connectionManager.initialize();
  
  // Initialize repositories
  const debateRepository = new SQLiteDebateRepository();
  const debaterRepository = new SQLiteDebaterRepository();
  const settingsRepository = new SQLiteSettingsRepository();
  
  // Initialize services
  const llmService = new LLMService(llmConfig);
  const debateService = new DebateService(debateRepository, debaterRepository, llmService);
  const moderatorService = new ModeratorService(debateRepository, debaterRepository, llmService);
  const settingsService = new SettingsService(settingsRepository);
  
  return { 
    debateRepository, 
    debaterRepository, 
    settingsRepository,
    llmService,
    debateService,
    moderatorService,
    settingsService,
    connectionManager 
  };
}

// Start server with proper initialization
async function startServer() {
  try {
    // Initialize all services
    const { 
      debaterRepository, 
      llmService, 
      debateService, 
      moderatorService, 
      settingsService, 
      connectionManager 
    } = await initializeServices();
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    
    // Debater routes
    app.use('/api/debaters', createDebaterRoutes(debaterRepository));
    
    // Debate routes (new multi-debate system)
    app.use('/api/debates', createDebateRoutes(debateService, moderatorService));
    
    // Settings routes
    app.use('/api/settings', createSettingsRoutes(settingsService));
    
    // LLM routes
    app.use('/api/llm', createLLMRoutes(llmService));

    // Global error handling middleware (must be last)
    app.use(errorHandler);

    // 404 handler (before error middleware)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Eristic backend server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🤖 LLM Provider: ${llmConfig.provider} (${llmConfig.baseUrl})`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Setup graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      await connectionManager.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();