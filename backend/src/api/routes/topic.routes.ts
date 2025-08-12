import { TopicController } from '@eristic/api/controllers/topic.controller';
import { TopicService } from '@eristic/app/services/topic.service';
import { TopicRepository, DebaterRepository } from '@eristic/infrastructure/database/repositories';
import { LLMService } from '@eristic/app/services/llm.service';

import { Router } from 'express';

export function createTopicRoutes(llmService: LLMService, topicRepository: TopicRepository, debaterRepository: DebaterRepository): Router {
  const router = Router();
  const topicService = new TopicService(llmService, topicRepository, debaterRepository);
  const topicController = new TopicController(topicService);

  // Generate content for a topic
  router.post('/', topicController.generateTopicContent);

  // Topic management endpoints
  router.get('/', topicController.getAllTopics);
  router.get('/:topic', topicController.getTopic);
  router.delete('/:topic', topicController.deleteTopic);

  return router;
}