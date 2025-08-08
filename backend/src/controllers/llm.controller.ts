import { LLMService } from '@eristic/services/llm.service';
import { APIResponse } from '@eristic/types/api.types';
import { LLMMessage } from '@eristic/types/llm.types';

import { Request, Response } from 'express';

export class LLMController {
  constructor(private llmService: LLMService) {}

  async generateTopicResponse(req: Request, res: Response): Promise<void> {
    try {
      const { topic } = req.body;

      if (!topic || typeof topic !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Topic is required and must be a string'
        });
        return;
      }

      const response = await this.llmService.generateTopicResponse(topic.trim());

      res.json({
        success: true,
        data: response
      } as APIResponse);
    } catch (error) {
      console.error('Error generating topic response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate topic response',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as APIResponse);
    }
  }

  async generateChatResponse(req: Request, res: Response): Promise<void> {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
        return;
      }

      // Validate message structure
      for (const msg of messages) {
        if (!msg.role || !msg.content || !['user', 'assistant', 'system'].includes(msg.role)) {
          res.status(400).json({
            success: false,
            error: 'Each message must have a role (user/assistant/system) and content'
          });
          return;
        }
      }

      const response = await this.llmService.generateCustomResponse(messages as LLMMessage[]);

      res.json({
        success: true,
        data: response
      } as APIResponse);
    } catch (error) {
      console.error('Error generating chat response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate chat response',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as APIResponse);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = await this.llmService.isProviderAvailable();
      const providerInfo = this.llmService.getProviderInfo();

      res.json({
        success: true,
        data: {
          available: isAvailable,
          provider: providerInfo
        }
      } as APIResponse);
    } catch (error) {
      console.error('Error checking LLM status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check LLM status',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as APIResponse);
    }
  }

  async getAvailableModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await this.llmService.getAvailableModels();

      res.json({
        success: true,
        data: {
          models
        }
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available models',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as APIResponse);
    }
  }
}