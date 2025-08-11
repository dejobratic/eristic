import { OllamaProvider } from '@eristic/infrastructure/providers/ollama.provider';
import { LLMProvider } from '@eristic/infrastructure/providers/base.provider';
import { LLMMessage, LLMResponse, LLMConfig } from '@eristic/app/types/llm.types';
import { ValidationException } from '@eristic/app/types/exceptions.types';

export class LLMService {
  private provider: LLMProvider;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider.toLowerCase()) {
      case 'ollama':
        return new OllamaProvider(config);
      // Future providers can be added here:
      // case 'openai':
      //   return new OpenAIProvider(config);
      // case 'claude':
      //   return new ClaudeProvider(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  async generateTopicResponse(topic: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant in an application called Eristic. When a user provides a topic, provide informative, engaging, and well-structured content about that topic. Be concise but comprehensive, and format your response in a readable way.'
      },
      {
        role: 'user',
        content: `Please provide information and insights about the following topic: "${topic}"`
      }
    ];

    try {
      return await this.provider.generateResponse(messages, this.config.options);
    } catch (error) {
      throw new Error(`Failed to generate topic response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCustomResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!messages || !Array.isArray(messages)) {
      throw new ValidationException('Messages array is required');
    }

    if (messages.length === 0) {
      throw new ValidationException('Messages array cannot be empty');
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant', 'system'].includes(msg.role)) {
        throw new ValidationException('Each message must have a role (user/assistant/system) and content');
      }
    }

    try {
      return await this.provider.generateResponse(messages, this.config.options);
    } catch (error) {
      throw new Error(`Failed to generate custom response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isProviderAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  async getAvailableModels(): Promise<string[]> {
    return this.provider.getAvailableModels();
  }

  getProviderInfo(): { provider: string; model?: string; baseUrl?: string } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      baseUrl: this.config.baseUrl
    };
  }
}