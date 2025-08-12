import { LLMResponse } from '@eristic/app/types/llm.types';

export interface TopicItem {
  id: string;
  name: string;
  llmResponse?: LLMResponse;
  debaterId?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class TopicRepository {
  abstract saveTopic(name: string, response: LLMResponse, debaterId?: string): Promise<void>;
  abstract getTopic(name: string): Promise<TopicItem | null>;
  abstract getAllTopics(): Promise<TopicItem[]>;
  abstract deleteTopic(name: string): Promise<void>;
}