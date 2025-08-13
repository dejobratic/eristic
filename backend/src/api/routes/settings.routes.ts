import { Router } from 'express';
import { SettingsController } from '@eristic/api/controllers/settings.controller';
import { SettingsService } from '@eristic/app/services/settings.service';

export function createSettingsRoutes(settingsService: SettingsService): Router {
  const router = Router();
  const settingsController = new SettingsController(settingsService);

  // Debate settings
  router.get('/debate', settingsController.getDebateSettings);
  router.put('/debate', settingsController.updateDebateSettings);
  router.post('/debate/reset', settingsController.resetDebateSettings);

  return router;
}