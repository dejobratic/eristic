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

  async generateTopicContent(topicName: string): Promise<TopicItem> {
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

    // Generate new content via LLM (using default debater if no specific one is cached)
    const response = await this.llmService.generateTopicResponse(trimmedTopic);
    
    // Save to repository
    await this.topicRepository.saveTopic(trimmedTopic, response, 'default');
    
    // Return the saved topic
    const savedTopic = await this.topicRepository.getTopic(trimmedTopic);
    if (!savedTopic) {
      throw new Error('Failed to retrieve saved topic');
    }
    
    return savedTopic;
  }

  async generateTopicContentWithDebater(topicName: string, debaterId: string): Promise<TopicItem> {
    if (!topicName || typeof topicName !== 'string') {
      throw new ValidationException('Topic is required and must be a string');
    }
    if (!debaterId || typeof debaterId !== 'string') {
      throw new ValidationException('Debater ID is required and must be a string');
    }

    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) {
      throw new ValidationException('Topic cannot be empty');
    }

    // Get the debater
    const debater = await this.debaterRepository.getDebater(debaterId);
    if (!debater) {
      throw new NotFoundException('Debater');
    }

    // Generate new content via LLM with the specific debater
    const response = await this.llmService.generateTopicResponseWithDebater(trimmedTopic, debater);
    
    // Save to repository with debater ID
    await this.topicRepository.saveTopic(trimmedTopic, response, debaterId);
    
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