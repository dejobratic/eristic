import { Router } from 'express';
import { DebateController } from '@eristic/api/controllers/debate.controller';
import { DebateService } from '@eristic/app/services/debate.service';
import { ModeratorService } from '@eristic/app/services/moderator.service';

export function createDebateRoutes(debateService: DebateService, moderatorService: ModeratorService): Router {
  const router = Router();
  const debateController = new DebateController(debateService, moderatorService);

  // Debate management
  router.post('/', debateController.createDebate);
  router.get('/', debateController.getAllDebates);
  router.get('/:debateId', debateController.getDebate);
  router.delete('/:debateId', debateController.deleteDebate);
  
  // Debate flow control
  router.post('/:debateId/start', debateController.startDebate);
  router.post('/:debateId/pause', debateController.pauseDebate);
  router.post('/:debateId/resume', debateController.resumeDebate);
  router.post('/:debateId/next', debateController.processNextResponse);
  
  // Data retrieval
  router.get('/:debateId/participants', debateController.getDebateParticipants);
  router.get('/:debateId/rounds', debateController.getDebateRounds);
  router.get('/:debateId/responses', debateController.getDebateResponses);
  
  // Moderation
  router.get('/:debateId/summary/round/:roundNumber', debateController.generateRoundSummary);
  router.get('/:debateId/summary/final', debateController.generateFinalSummary);

  return router;
}