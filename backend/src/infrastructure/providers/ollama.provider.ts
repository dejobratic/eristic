import { LLMProvider } from '@eristic/infrastructure/providers/base.provider';
import { HttpService } from '@eristic/app/services/http.service';
import { LLMMessage, LLMResponse, LLMOptions, LLMConfig } from '@eristic/app/types/llm.types';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options: {
    temperature: number;
    num_predict: number;
  };
}

interface OllamaGenerateResponse {
  response: string;
  model: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaModelsResponse {
  models: Array<{ name: string }>;
}

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private defaultModel: string;
  private httpService: HttpService;

  constructor(config: LLMConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.model || 'llama2';
    this.httpService = new HttpService();
  }

  async generateResponse(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;
    const prompt = this.formatMessagesForOllama(messages);
    
    const payload: OllamaGenerateRequest = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.7,
        num_predict: options?.maxTokens || -1,
      }
    };

    try {
      const url = this.httpService.buildUrl(this.baseUrl, '/api/generate');
      const data = await this.httpService.post<OllamaGenerateResponse, OllamaGenerateRequest>(
        url, 
        payload
      );

      return {
        content: data.response,
        model: data.model,
        timestamp: new Date(),
        tokens: {
          prompt: data.prompt_eval_count || 0,
          completion: data.eval_count || 0,
          total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error) {
      console.error('Failed to generate response from Ollama:', error);
      
      if (this.httpService.isNetworkError(error)) {
        throw new Error('Unable to connect to Ollama service. Please ensure Ollama is running.');
      } else if (this.httpService.isHttpError(error)) {
        throw new Error(`Ollama API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      throw new Error(`Failed to generate response from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    const url = this.httpService.buildUrl(this.baseUrl, '/api/tags');
    return await this.httpService.isReachable(url, 5000);
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const url = this.httpService.buildUrl(this.baseUrl, '/api/tags');
      const data = await this.httpService.get<OllamaModelsResponse>(url);
      return data.models?.map((model) => model.name) || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  private formatMessagesForOllama(messages: LLMMessage[]): string {
    return messages
      .map((msg) => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`;
          case 'user':
            return `Human: ${msg.content}`;
          case 'assistant':
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n');
  }
}