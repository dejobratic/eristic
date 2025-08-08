import 'dotenv/config';

import { createLLMRoutes } from '@eristic/routes/llm.routes';
import { LLMService } from '@eristic/services/llm.service';
import { LLMConfig } from '@eristic/types/llm.types';

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

// Initialize LLM Service
const llmService = new LLMService(llmConfig);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// LLM routes
app.use('/api/llm', createLLMRoutes(llmService));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});