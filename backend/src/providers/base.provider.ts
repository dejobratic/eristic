import { LLMMessage, LLMResponse, LLMOptions } from '@eristic/types/llm.types';

export interface LLMProvider {
  generateResponse(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
  getAvailableModels(): Promise<string[]>;
}