import { DebateService } from '@eristic/app/services/debate.service';
import { ModeratorService } from '@eristic/app/services/moderator.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { asyncHandler } from '@eristic/api/middleware/async-handler';

import { Request, Response } from 'express';

export class DebateController {
  constructor(
    private debateService: DebateService,
    private moderatorService: ModeratorService
  ) {}

  createDebate = asyncHandler(async (req: Request, res: Response) => {
    const { topic, participantIds, moderatorId, settings } = req.body;
    
    const debate = await this.debateService.createDebate({
      topic,
      participantIds,
      moderatorId,
      settings
    });

    res.json({
      success: true,
      data: debate
    } as APIResponse);
  });

  getAllDebates = asyncHandler(async (req: Request, res: Response) => {
    const debates = await this.debateService.getAllDebates();

    res.json({
      success: true,
      data: debates
    } as APIResponse);
  });

  getDebate = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const debate = await this.debateService.getDebateWithDetails(debateId);

    res.json({
      success: true,
      data: debate
    } as APIResponse);
  });

  startDebate = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    await this.debateService.startDebate(debateId);

    res.json({
      success: true,
      data: { message: 'Debate started successfully' }
    } as APIResponse);
  });

  processNextResponse = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const response = await this.debateService.processNextResponse(debateId);

    res.json({
      success: true,
      data: response
    } as APIResponse);
  });

  pauseDebate = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    await this.debateService.pauseDebate(debateId);

    res.json({
      success: true,
      data: { message: 'Debate paused successfully' }
    } as APIResponse);
  });

  resumeDebate = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    await this.debateService.resumeDebate(debateId);

    res.json({
      success: true,
      data: { message: 'Debate resumed successfully' }
    } as APIResponse);
  });

  deleteDebate = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    await this.debateService.deleteDebate(debateId);

    res.json({
      success: true,
      data: { message: 'Debate deleted successfully' }
    } as APIResponse);
  });

  generateRoundSummary = asyncHandler(async (req: Request, res: Response) => {
    const { debateId, roundNumber } = req.params;
    const summary = await this.moderatorService.generateRoundSummary(debateId, parseInt(roundNumber));

    res.json({
      success: true,
      data: { summary }
    } as APIResponse);
  });

  generateFinalSummary = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const summary = await this.moderatorService.generateFinalSummary(debateId);

    res.json({
      success: true,
      data: { summary }
    } as APIResponse);
  });

  getDebateParticipants = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const participants = await this.debateService.getDebateParticipants(debateId);

    res.json({
      success: true,
      data: participants
    } as APIResponse);
  });

  getDebateRounds = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const rounds = await this.debateService.getDebateRounds(debateId);

    res.json({
      success: true,
      data: rounds
    } as APIResponse);
  });

  getDebateResponses = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const responses = await this.debateService.getAllDebateResponses(debateId);

    res.json({
      success: true,
      data: responses
    } as APIResponse);
  });

  generateParticipantResponse = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    const { participantId } = req.body;

    const response = await this.debateService.generateParticipantResponse(debateId, participantId);

    res.json({
      success: true,
      data: response
    } as APIResponse);
  });

  skipCurrentParticipant = asyncHandler(async (req: Request, res: Response) => {
    const { debateId } = req.params;
    await this.debateService.skipCurrentParticipant(debateId);

    res.json({
      success: true,
      data: { message: 'Participant skipped successfully' }
    } as APIResponse);
  });
}