import { DebateRepository } from '@eristic/infrastructure/database/repositories';
import { DebaterRepository } from '@eristic/infrastructure/database/repositories';
import { LLMService } from '@eristic/app/services/llm.service';
import { DebateWithDetails, DebateRound, DebateResponse } from '@eristic/app/types/debate.types';
import { Debater } from '@eristic/app/types/debater.types';
import { NotFoundException } from '@eristic/app/types/exceptions.types';

export class ModeratorService {
  constructor(
    private debateRepository: DebateRepository,
    private debaterRepository: DebaterRepository,
    private llmService: LLMService
  ) {}

  async generateRoundSummary(debateId: string, roundNumber: number): Promise<string> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    const moderator = await this.debaterRepository.getDebater(debate.moderatorId);
    if (!moderator) {
      throw new NotFoundException('Moderator');
    }

    // Get responses for the completed round
    const roundResponses = await this.debateRepository.getRoundResponses(debateId, roundNumber);
    
    // Get all previous responses for context
    const allPreviousResponses = await this.debateRepository.getAllDebateResponses(debateId);
    const previousRoundResponses = allPreviousResponses.filter(r => {
      // Find responses from rounds before the current one
      return r.roundId !== roundResponses[0]?.roundId;
    });

    const prompt = this.buildSummaryPrompt(debate, roundNumber, roundResponses, previousRoundResponses);
    
    const response = await this.llmService.generateTopicResponseWithDebater(prompt, moderator);
    
    return response.content;
  }

  async generateNextRoundPrompt(debateId: string, nextRoundNumber: number): Promise<string> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    const moderator = await this.debaterRepository.getDebater(debate.moderatorId);
    if (!moderator) {
      throw new NotFoundException('Moderator');
    }

    // Get all previous responses
    const allResponses = await this.debateRepository.getAllDebateResponses(debateId);
    
    const prompt = this.buildNextRoundPrompt(debate, nextRoundNumber, allResponses);
    
    const response = await this.llmService.generateTopicResponseWithDebater(prompt, moderator);
    
    return response.content;
  }

  async generateFinalSummary(debateId: string): Promise<string> {
    const debate = await this.debateRepository.getDebateWithDetails(debateId);
    if (!debate) {
      throw new NotFoundException('Debate');
    }

    const moderator = await this.debaterRepository.getDebater(debate.moderatorId);
    if (!moderator) {
      throw new NotFoundException('Moderator');
    }

    // Get all responses from the debate
    const allResponses = await this.debateRepository.getAllDebateResponses(debateId);
    
    const prompt = this.buildFinalSummaryPrompt(debate, allResponses);
    
    const response = await this.llmService.generateTopicResponseWithDebater(prompt, moderator);
    
    return response.content;
  }

  async updateRoundWithSummary(debateId: string, roundNumber: number): Promise<void> {
    const round = await this.debateRepository.getRoundByNumber(debateId, roundNumber);
    if (!round) {
      throw new NotFoundException('Round');
    }

    const summary = await this.generateRoundSummary(debateId, roundNumber);
    await this.debateRepository.updateRoundSummary(round.id, summary);
  }

  private buildSummaryPrompt(
    debate: DebateWithDetails,
    roundNumber: number,
    roundResponses: DebateResponse[],
    previousResponses: DebateResponse[]
  ): string {
    let prompt = `You are the moderator for a debate on: "${debate.topic}"\n\n`;
    
    prompt += `Your role is to provide a neutral, balanced summary of Round ${roundNumber}.\n\n`;
    
    prompt += `ROUND ${roundNumber} RESPONSES:\n`;
    for (let i = 0; i < roundResponses.length; i++) {
      const response = roundResponses[i];
      prompt += `\nDebater ${i + 1}: ${response.content}\n`;
    }
    
    if (previousResponses.length > 0) {
      prompt += `\nPREVIOUS ROUNDS CONTEXT:\n`;
      prompt += `(Previous responses for context - summarize key themes)\n`;
      
      // Group previous responses by round for clarity
      const responsesByRound = new Map<string, DebateResponse[]>();
      for (const response of previousResponses) {
        if (!responsesByRound.has(response.roundId)) {
          responsesByRound.set(response.roundId, []);
        }
        responsesByRound.get(response.roundId)!.push(response);
      }
      
      let roundCounter = 1;
      for (const [roundId, responses] of responsesByRound) {
        if (roundCounter < roundNumber) {
          prompt += `\nRound ${roundCounter}:\n`;
          responses.forEach((response, index) => {
            prompt += `Debater ${index + 1}: ${response.content.substring(0, 200)}...\n`;
          });
          roundCounter++;
        }
      }
    }
    
    prompt += `\nAs the moderator, provide a concise summary of Round ${roundNumber} that:\n`;
    prompt += `1. Identifies the key arguments presented by each debater\n`;
    prompt += `2. Notes any areas of agreement or disagreement\n`;
    prompt += `3. Highlights how the discussion has evolved\n`;
    prompt += `4. Remains neutral and balanced\n`;
    prompt += `5. Is 100-300 words\n\n`;
    
    prompt += `Focus on the substance of the arguments rather than the quality of presentation.`;
    
    return prompt;
  }

  private buildNextRoundPrompt(
    debate: DebateWithDetails,
    nextRoundNumber: number,
    allResponses: DebateResponse[]
  ): string {
    let prompt = `You are the moderator for a debate on: "${debate.topic}"\n\n`;
    
    prompt += `The debate has completed ${nextRoundNumber - 1} round(s). `;
    prompt += `Now provide guidance for Round ${nextRoundNumber} of ${debate.totalRounds}.\n\n`;
    
    if (allResponses.length > 0) {
      prompt += `DEBATE SO FAR:\n`;
      
      // Group responses by round
      const responsesByRound = new Map<string, DebateResponse[]>();
      for (const response of allResponses) {
        if (!responsesByRound.has(response.roundId)) {
          responsesByRound.set(response.roundId, []);
        }
        responsesByRound.get(response.roundId)!.push(response);
      }
      
      let roundCounter = 1;
      for (const [roundId, responses] of responsesByRound) {
        prompt += `\nRound ${roundCounter}:\n`;
        responses.forEach((response, index) => {
          prompt += `Debater ${index + 1}: ${response.content.substring(0, 300)}...\n`;
        });
        roundCounter++;
      }
    }
    
    prompt += `\nAs the moderator, provide direction for Round ${nextRoundNumber} that:\n`;
    prompt += `1. Summarizes the key themes that have emerged\n`;
    prompt += `2. Identifies specific areas that need deeper exploration\n`;
    prompt += `3. Suggests questions or angles for debaters to consider\n`;
    prompt += `4. Encourages engagement with opposing viewpoints\n`;
    prompt += `5. Maintains focus on the core debate topic\n`;
    prompt += `6. Is 150-400 words\n\n`;
    
    if (nextRoundNumber === debate.totalRounds) {
      prompt += `Note: This is the final round, so encourage debaters to present their strongest closing arguments.`;
    } else {
      prompt += `Encourage debaters to build upon previous arguments and address counterpoints.`;
    }
    
    return prompt;
  }

  private buildFinalSummaryPrompt(
    debate: DebateWithDetails,
    allResponses: DebateResponse[]
  ): string {
    let prompt = `You are the moderator providing a final summary for the debate on: "${debate.topic}"\n\n`;
    
    prompt += `This debate consisted of ${debate.totalRounds} rounds with ${debate.participants.filter(p => p.role === 'debater').length} participants.\n\n`;
    
    prompt += `COMPLETE DEBATE TRANSCRIPT:\n`;
    
    // Group responses by round for final summary
    const responsesByRound = new Map<string, DebateResponse[]>();
    for (const response of allResponses) {
      if (!responsesByRound.has(response.roundId)) {
        responsesByRound.set(response.roundId, []);
      }
      responsesByRound.get(response.roundId)!.push(response);
    }
    
    let roundCounter = 1;
    for (const [roundId, responses] of responsesByRound) {
      prompt += `\nROUND ${roundCounter}:\n`;
      responses.forEach((response, index) => {
        prompt += `\nDebater ${index + 1}: ${response.content}\n`;
      });
      roundCounter++;
    }
    
    prompt += `\nAs the moderator, provide a comprehensive final summary that:\n`;
    prompt += `1. Summarizes the main arguments presented by each side\n`;
    prompt += `2. Identifies key points of agreement and disagreement\n`;
    prompt += `3. Evaluates how well each position was supported\n`;
    prompt += `4. Notes the evolution of arguments throughout the debate\n`;
    prompt += `5. Highlights the most compelling points from each participant\n`;
    prompt += `6. Provides a balanced assessment without declaring a "winner"\n`;
    prompt += `7. Is 400-800 words\n\n`;
    
    prompt += `Remember to remain neutral and focus on the quality and substance of the arguments presented.`;
    
    return prompt;
  }
}