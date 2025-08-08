import { OllamaProvider } from '@eristic/providers/ollama.provider';
import { LLMProvider } from '@eristic/providers/base.provider';
import { LLMMessage, LLMResponse, LLMConfig } from '@eristic/types/llm.types';

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