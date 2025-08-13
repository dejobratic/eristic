import { TopicService } from '@eristic/app/services/topic.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { asyncHandler } from '@eristic/api/middleware/async-handler';

import { Request, Response } from 'express';

export class TopicController {
  constructor(private topicService: TopicService) {}

  generateTopicContent = asyncHandler(async (req: Request, res: Response) => {
    const { topic, debaterId } = req.body;
    
    // Use the unified method that accepts optional debater
    const result = await this.topicService.generateTopicContent(topic, debaterId);

    res.json({
      success: true,
      data: result
    } as APIResponse);
  });

  getAllTopics = asyncHandler(async (req: Request, res: Response) => {
    const topics = await this.topicService.getAllTopics();

    res.json({
      success: true,
      data: topics
    } as APIResponse);
  });

  getTopic = asyncHandler(async (req: Request, res: Response) => {
    const { topic } = req.params;
    const topicData = await this.topicService.getTopic(decodeURIComponent(topic));

    res.json({
      success: true,
      data: topicData
    } as APIResponse);
  });

  deleteTopic = asyncHandler(async (req: Request, res: Response) => {
    const { topic } = req.params;
    await this.topicService.deleteTopic(decodeURIComponent(topic));

    res.json({
      success: true,
      data: { message: 'Topic deleted successfully' }
    } as APIResponse);
  });
}