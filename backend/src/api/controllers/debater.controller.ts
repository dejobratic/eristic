import { DebaterService } from '@eristic/app/services/debater.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { asyncHandler } from '@eristic/api/middleware/async-handler';

import { Request, Response } from 'express';

export class DebaterController {
  constructor(private debaterService: DebaterService) {}

  createDebater = asyncHandler(async (req: Request, res: Response) => {
    const debaterData = req.body;
    const result = await this.debaterService.createDebater(debaterData);

    res.status(201).json({
      success: true,
      data: result
    } as APIResponse);
  });

  getDebater = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const debater = await this.debaterService.getDebater(id);

    res.json({
      success: true,
      data: debater
    } as APIResponse);
  });

  getAllDebaters = asyncHandler(async (req: Request, res: Response) => {
    const debaters = await this.debaterService.getAllDebaters();

    res.json({
      success: true,
      data: debaters
    } as APIResponse);
  });

  getActiveDebaters = asyncHandler(async (req: Request, res: Response) => {
    const debaters = await this.debaterService.getActiveDebaters();

    res.json({
      success: true,
      data: debaters
    } as APIResponse);
  });

  updateDebater = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const result = await this.debaterService.updateDebater(id, updates);

    res.json({
      success: true,
      data: result
    } as APIResponse);
  });

  deleteDebater = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.debaterService.deleteDebater(id);

    res.json({
      success: true,
      data: { message: 'Debater deleted successfully' }
    } as APIResponse);
  });
}