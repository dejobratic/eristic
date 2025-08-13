import { TopicRepository, TopicItem, DebaterRepository } from '@eristic/infrastructure/database/repositories';
import { LLMService } from '@eristic/app/services/llm.service';
import { Debater } from '@eristic/app/types/debater.types';
import { ValidationException, NotFoundException } from '@eristic/app/types/exceptions.types';

export class TopicService {
  constructor(
    private llmService: LLMService,
    private topicRepository: TopicRepository,
    private debaterRepository: DebaterRepository
  ) {}

  async generateTopicContent(topicName: string, debaterId?: string): Promise<TopicItem> {
    if (!topicName || typeof topicName !== 'string') {
      throw new ValidationException('Topic is required and must be a string');
    }

    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) {
      throw new ValidationException('Topic cannot be empty');
    }

    // Check if we already have cached content
    const existingTopic = await this.topicRepository.getTopic(trimmedTopic);
    if (existingTopic?.llmResponse) {
      return existingTopic;
    }

    let response;
    let finalDebaterId = debaterId || 'default';

    if (debaterId && debaterId !== 'default') {
      // Get the specific debater
      const debater = await this.debaterRepository.getDebater(debaterId);
      if (!debater) {
        throw new NotFoundException('Debater');
      }
      // Generate with specific debater
      response = await this.llmService.generateTopicResponseWithDebater(trimmedTopic, debater);
    } else {
      // Generate with default debater
      response = await this.llmService.generateTopicResponse(trimmedTopic);
      finalDebaterId = 'default';
    }
    
    // Save to repository
    await this.topicRepository.saveTopic(trimmedTopic, response, finalDebaterId);
    
    // Return the saved topic
    const savedTopic = await this.topicRepository.getTopic(trimmedTopic);
    if (!savedTopic) {
      throw new Error('Failed to retrieve saved topic');
    }
    
    return savedTopic;
  }

  async getAllTopics(): Promise<TopicItem[]> {
    return await this.topicRepository.getAllTopics();
  }

  async getTopic(topicName: string): Promise<TopicItem> {
    if (!topicName || typeof topicName !== 'string') {
      throw new ValidationException('Topic parameter is required');
    }

    const topic = await this.topicRepository.getTopic(topicName);
    if (!topic) {
      throw new NotFoundException('Topic');
    }
    return topic;
  }

  async deleteTopic(topicName: string): Promise<void> {
    if (!topicName || typeof topicName !== 'string') {
      throw new ValidationException('Topic parameter is required');
    }

    // Verify topic exists before deletion
    await this.getTopic(topicName); // This will throw NotFoundException if not found
    await this.topicRepository.deleteTopic(topicName);
  }
}