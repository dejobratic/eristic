import { LLMController } from '@eristic/controllers/llm.controller';
import { LLMService } from '@eristic/services/llm.service';

import { Router } from 'express';

export function createLLMRoutes(llmService: LLMService): Router {
  const router = Router();
  const llmController = new LLMController(llmService);

  // Generate response for a topic
  router.post('/topic', (req, res) => llmController.generateTopicResponse(req, res));

  // Generate custom response with message history
  router.post('/chat', (req, res) => llmController.generateChatResponse(req, res));

  // Check if LLM provider is available
  router.get('/status', (req, res) => llmController.getStatus(req, res));

  // Get available models
  router.get('/models', (req, res) => llmController.getAvailableModels(req, res));

  return router;
}