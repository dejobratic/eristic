import { LLMService } from '@eristic/app/services/llm.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { LLMMessage } from '@eristic/app/types/llm.types';
import { asyncHandler } from '@eristic/api/middleware/async-handler';

import { Request, Response } from 'express';

export class LLMController {
  constructor(private llmService: LLMService) {}


  generateChatResponse = asyncHandler(async (req: Request, res: Response) => {
    const { messages } = req.body;
    const response = await this.llmService.generateCustomResponse(messages as LLMMessage[]);

    res.json({
      success: true,
      data: response
    } as APIResponse);
  });

  getStatus = asyncHandler(async (req: Request, res: Response) => {
    const isAvailable = await this.llmService.isProviderAvailable();
    const providerInfo = this.llmService.getProviderInfo();

    res.json({
      success: true,
      data: {
        available: isAvailable,
        provider: providerInfo
      }
    } as APIResponse);
  });

  getAvailableModels = asyncHandler(async (req: Request, res: Response) => {
    const models = await this.llmService.getAvailableModels();

    res.json({
      success: true,
      data: {
        models
      }
    } as APIResponse);
  });
}