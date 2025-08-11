import { LLMController } from '@eristic/api/controllers/llm.controller';
import { LLMService } from '@eristic/app/services/llm.service';

import { Router } from 'express';

export function createLLMRoutes(llmService: LLMService): Router {
  const router = Router();
  const llmController = new LLMController(llmService);

  // Generate custom response with message history
  router.post('/chat', llmController.generateChatResponse);

  // Check if LLM provider is available
  router.get('/status', llmController.getStatus);

  // Get available models
  router.get('/models', llmController.getAvailableModels);

  return router;
}