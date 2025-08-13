import { SettingsService } from '@eristic/app/services/settings.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { asyncHandler } from '@eristic/api/middleware/async-handler';

import { Request, Response } from 'express';

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  getDebateSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await this.settingsService.getDebateSettings();

    res.json({
      success: true,
      data: settings
    } as APIResponse);
  });

  updateDebateSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = req.body;
    await this.settingsService.updateDebateSettings(settings);

    res.json({
      success: true,
      data: { message: 'Settings updated successfully' }
    } as APIResponse);
  });

  resetDebateSettings = asyncHandler(async (req: Request, res: Response) => {
    await this.settingsService.resetDebateSettings();

    res.json({
      success: true,
      data: { message: 'Settings reset to defaults' }
    } as APIResponse);
  });
}