import { DebaterController } from '@eristic/api/controllers/debater.controller';
import { DebaterService } from '@eristic/app/services/debater.service';
import { DebaterRepository } from '@eristic/infrastructure/database/repositories';

import { Router } from 'express';

export function createDebaterRoutes(debaterRepository: DebaterRepository): Router {
  const router = Router();
  const debaterService = new DebaterService(debaterRepository);
  const debaterController = new DebaterController(debaterService);

  // Debater management endpoints
  router.post('/', debaterController.createDebater);
  router.get('/', debaterController.getAllDebaters);
  router.get('/active', debaterController.getActiveDebaters);
  router.get('/:id', debaterController.getDebater);
  router.put('/:id', debaterController.updateDebater);
  router.delete('/:id', debaterController.deleteDebater);

  return router;
}