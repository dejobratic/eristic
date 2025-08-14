import { DebateRepository } from '@eristic/infrastructure/database/repositories';
import { DebaterRepository } from '@eristic/infrastructure/database/repositories';
import { LLMService } from '@eristic/app/services/llm.service';
import { Debate, DebateParticipant, DebateRound, DebateResponse, DebateWithDetails, CreateDebateRequest, DebateSettings } from '@eristic/app/types/debate.types';
import { Debater } from '@eristic/app/types/debater.types';
import { ValidationException, NotFoundException } from '@eristic/app/types/exceptions.types';

export class DebateService {
  constructor(
    private debateRepository: DebateRepository,
    private debaterRepository: DebaterRepository,
    private llmService: LLMService
  ) {}

  async createDebate(request: CreateDebateRequest): Promise<Debate> {
    // Validate participants
    if (request.participantIds.length < 2 || request.participantIds.length > 5) {
      throw new ValidationException('Debate must have between 2 and 5 participants');
    }

    // Validate moderator exists (skip validation for 'default' moderator)
    if (request.moderatorId !== 'default') {
      const moderator = await this.debaterRepository.getDebater(request.moderatorId);
      if (!moderator) {
        throw new NotFoundException('Moderator');
      }
    }

    // Validate all participants exist
    for (const participantId of request.participantIds) {
      const participant = await this.debaterRepository.getDebater(participantId);
      if (!participant) {
        throw new NotFoundException(`Debater ${participantId}`);
      }
    }

    // Validate settings
    this.validateDebateSettings(request.settings);

    return await this.debateRepository.createDebate(request);
  }

  async getDebate(debateId: string): Promise<Debate | null> {
    return await this.debateRepository.getDebate(debateId);
  }

  async getDebateWithDetails(debateId: string): Promise<DebateWithDetails | null> {
    return await this.debateRepository.getDebateWithDetails(debateId);
  }

  async getAllDebates(): Promise<Debate[]> {
    return await this.debateRepository.getAllDebates();
  }

  async startDebate(debateId: string): Promise<void> {
    const debate = await this.debateRepository.getDebate(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    if (debate.status === 'completed') {
      throw new ValidationException('Cannot start a completed debate');
    }

    // Create first round
    await this.debateRepository.createRound(debateId, 1);
    
    // Update debate status to active
    await this.debateRepository.updateDebateStatus(debateId, 'active');
  }

  async processNextResponse(debateId: string): Promise<DebateResponse | null> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    if (debate.status !== 'active') {
      throw new ValidationException('Debate must be active to process responses');
    }

    // Get current round
    let currentRound = await this.debateRepository.getRoundByNumber(debateId, debate.currentRound);
    if (!currentRound) {
      // Create the round if it doesn't exist
      currentRound = await this.debateRepository.createRound(debateId, debate.currentRound);
    }

    // Get existing responses for this round
    const existingResponses = await this.debateRepository.getResponses(currentRound.id);
    
    // Determine next responder
    const nextResponseOrder = existingResponses.length + 1;
    const debaters = debate.participants.filter(p => p.role === 'debater');
    
    if (nextResponseOrder > debaters.length) {
      // Round is complete, move to next round or end debate
      await this.completeRound(debateId, debate.currentRound);
      return null;
    }

    // Get the debater for this response order
    const nextDebater = debaters.find(p => p.position === nextResponseOrder);
    if (!nextDebater) {
      throw new ValidationException('Could not determine next debater');
    }

    // Get debater details
    const debaterDetails = await this.debaterRepository.getDebater(nextDebater.debaterId);
    if (!debaterDetails) {
      throw new NotFoundException(`Debater ${nextDebater.debaterId}`);
    }

    // Generate response
    const response = await this.generateDebateResponse(debate, currentRound, debaterDetails, nextResponseOrder);
    
    // Save response
    const savedResponse = await this.debateRepository.addResponse({
      roundId: currentRound.id,
      debaterId: nextDebater.debaterId,
      content: response.content,
      responseOrder: nextResponseOrder,
      model: response.model,
      tokens: response.tokens
    });

    return savedResponse;
  }

  async generateParticipantResponse(debateId: string, participantId: string): Promise<DebateResponse> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    if (debate.status !== 'active') {
      throw new ValidationException('Debate must be active to generate responses');
    }

    // Get current round
    let currentRound = await this.debateRepository.getRoundByNumber(debateId, debate.currentRound);
    if (!currentRound) {
      currentRound = await this.debateRepository.createRound(debateId, debate.currentRound);
    }

    // Find the participant
    const participant = debate.participants.find(p => p.debaterId === participantId && p.role === 'debater');
    if (!participant) {
      throw new NotFoundException(`Participant ${participantId}`);
    }

    // Get existing responses for this round to determine response order
    const existingResponses = await this.debateRepository.getResponses(currentRound.id);
    const nextResponseOrder = existingResponses.length + 1;

    // Get debater details
    const debaterDetails = await this.debaterRepository.getDebater(participantId);
    if (!debaterDetails) {
      throw new NotFoundException(`Debater ${participantId}`);
    }

    // Generate response
    const response = await this.generateDebateResponse(debate, currentRound, debaterDetails, nextResponseOrder);
    
    // Save response
    const savedResponse = await this.debateRepository.addResponse({
      roundId: currentRound.id,
      debaterId: participantId,
      content: response.content,
      responseOrder: nextResponseOrder,
      model: response.model,
      tokens: response.tokens
    });

    // Check if round is complete after this response
    const updatedResponses = await this.debateRepository.getResponses(currentRound.id);
    const debaters = debate.participants.filter(p => p.role === 'debater');
    
    if (updatedResponses.length >= debaters.length) {
      // Round is complete
      await this.completeRound(debateId, debate.currentRound);
    }

    return savedResponse;
  }

  async skipCurrentParticipant(debateId: string): Promise<void> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    if (debate.status !== 'active') {
      throw new ValidationException('Debate must be active to skip participants');
    }

    // Get current round
    let currentRound = await this.debateRepository.getRoundByNumber(debateId, debate.currentRound);
    if (!currentRound) {
      currentRound = await this.debateRepository.createRound(debateId, debate.currentRound);
    }

    // Get existing responses for this round
    const existingResponses = await this.debateRepository.getResponses(currentRound.id);
    const nextResponseOrder = existingResponses.length + 1;
    const debaters = debate.participants.filter(p => p.role === 'debater');

    if (nextResponseOrder > debaters.length) {
      // Round is already complete
      return;
    }

    // Add a placeholder response for the skipped participant
    const skippedParticipant = debaters.find(p => p.position === nextResponseOrder);
    if (skippedParticipant) {
      await this.debateRepository.addResponse({
        roundId: currentRound.id,
        debaterId: skippedParticipant.debaterId,
        content: '[Participant skipped their turn]',
        responseOrder: nextResponseOrder,
        model: 'system',
        tokens: { prompt: 0, completion: 0, total: 0 }
      });

      // Check if round is complete after this skip
      const updatedResponses = await this.debateRepository.getResponses(currentRound.id);
      if (updatedResponses.length >= debaters.length) {
        await this.completeRound(debateId, debate.currentRound);
      }
    }
  }

  async completeRound(debateId: string, roundNumber: number): Promise<void> {
    const debate = await this.debateRepository.getDebate(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    const round = await this.debateRepository.getRoundByNumber(debateId, roundNumber);
    if (!round) {
      throw new NotFoundException('Round');
    }

    // Mark round as completed
    await this.debateRepository.updateRoundStatus(round.id, 'completed');

    // Check if this was the last round
    if (roundNumber >= debate.totalRounds) {
      // Debate is complete
      await this.debateRepository.updateDebateStatus(debateId, 'completed');
    } else {
      // Move to next round
      const nextRoundNumber = roundNumber + 1;
      await this.debateRepository.updateCurrentRound(debateId, nextRoundNumber);
      
      // Create next round
      await this.debateRepository.createRound(debateId, nextRoundNumber);
    }
  }

  async pauseDebate(debateId: string): Promise<void> {
    await this.debateRepository.updateDebateStatus(debateId, 'paused');
  }

  async resumeDebate(debateId: string): Promise<void> {
    await this.debateRepository.updateDebateStatus(debateId, 'active');
  }

  async deleteDebate(debateId: string): Promise<void> {
    await this.debateRepository.deleteDebate(debateId);
  }

  async getDebateParticipants(debateId: string): Promise<DebateParticipant[]> {
    return await this.debateRepository.getParticipants(debateId);
  }

  async getDebateRounds(debateId: string): Promise<DebateRound[]> {
    return await this.debateRepository.getRounds(debateId);
  }

  async getAllDebateResponses(debateId: string): Promise<DebateResponse[]> {
    return await this.debateRepository.getAllDebateResponses(debateId);
  }

  private async generateDebateResponse(
    debate: DebateWithDetails, 
    round: DebateRound, 
    debater: Debater, 
    responseOrder: number
  ) {
    // Build context for the debater
    const previousResponses = await this.debateRepository.getAllDebateResponses(debate.id);
    
    // Create debate prompt
    const prompt = this.buildDebatePrompt(debate, round, debater, previousResponses, responseOrder);
    
    // Generate response using LLM service
    return await this.llmService.generateTopicResponseWithDebater(prompt, debater);
  }

  private buildDebatePrompt(
    debate: DebateWithDetails,
    round: DebateRound,
    debater: Debater,
    previousResponses: DebateResponse[],
    responseOrder: number
  ): string {
    let prompt = `You are participating in a structured debate about: "${debate.topic}"\n\n`;
    
    // Add round context
    prompt += `This is round ${round.roundNumber} of ${debate.totalRounds}.\n`;
    prompt += `You are responding as position ${responseOrder} in this round.\n\n`;
    
    // Add moderator summary if available
    if (round.moderationSummary) {
      prompt += `Moderator Summary:\n${round.moderationSummary}\n\n`;
    }
    
    // Add previous responses context
    if (previousResponses.length > 0) {
      prompt += 'Previous responses in this debate:\n\n';
      
      for (const response of previousResponses) {
        const responderName = this.getDebaterName(debate.participants, response.debaterId);
        prompt += `${responderName}: ${response.content}\n\n`;
      }
    }
    
    // Add debater instructions
    prompt += `Provide your response to this debate topic. `;
    prompt += `Stay focused on the topic and engage with the previous arguments. `;
    prompt += `Your response should be substantive but concise (aim for 200-500 words).`;
    
    return prompt;
  }

  private getDebaterName(participants: DebateParticipant[], debaterId: string): string {
    const participant = participants.find(p => p.debaterId === debaterId);
    return participant ? `Debater ${participant.position}` : 'Unknown Debater';
  }

  private validateDebateSettings(settings: DebateSettings): void {
    if (settings.numDebaters < 2 || settings.numDebaters > 5) {
      throw new ValidationException('Number of debaters must be between 2 and 5');
    }
    
    if (settings.numRounds < 1 || settings.numRounds > 10) {
      throw new ValidationException('Number of rounds must be between 1 and 10');
    }
    
    if (settings.responseTimeout && (settings.responseTimeout < 1 || settings.responseTimeout > 60)) {
      throw new ValidationException('Response timeout must be between 1 and 60 minutes');
    }
    
    if (settings.maxResponseLength && (settings.maxResponseLength < 100 || settings.maxResponseLength > 5000)) {
      throw new ValidationException('Max response length must be between 100 and 5000 characters');
    }
  }
}