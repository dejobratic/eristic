import { Injectable, inject, signal } from '@angular/core';

import { HttpService, HttpResponse } from '@eristic/app/services/http.service';
import { environment } from '@eristic/environments/environment';

export interface LLMResponse {
  content: string;
  model: string;
  timestamp: Date;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface LLMStatus {
  available: boolean;
  provider: {
    provider: string;
    model?: string;
    baseUrl?: string;
  };
}

interface ModelsResponse {
  models: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private readonly apiUrl = environment.backendUrl;
  private readonly httpService = inject(HttpService);
  
  private loadingState = signal<boolean>(false);
  private statusState = signal<LLMStatus | null>(null);

  constructor() {
    this.checkStatus();
  }

  async generateTopicResponse(topic: string): Promise<LLMResponse> {
    
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/llm/chat');
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant in an application called Eristic. When a user provides a topic, provide informative, engaging, and well-structured content about that topic. Be concise but comprehensive, and format your response in a readable way.'
        },
        {
          role: 'user' as const,
          content: `Please provide information and insights about the following topic: "${topic}"`
        }
      ];
      
      const response = await this.httpService.post<HttpResponse<LLMResponse>, { messages: any[] }>(
        url, 
        { messages }
      );
      
      const data = this.httpService.extractApiData(response);
      
      return {
        ...data,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      console.error('Error generating topic response:', error);
      
      // Provide more specific error messages
      if (this.httpService.isNetworkError(error)) {
        throw new Error('Unable to connect to the backend service. Please check if the backend is running.');
      } else if (this.httpService.isHttpError(error)) {
        throw new Error(`Backend service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async checkStatus(): Promise<LLMStatus> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/llm/status');
      const response = await this.httpService.get<HttpResponse<LLMStatus>>(url);
      
      const status = this.httpService.extractApiData(response);
      this.statusState.set(status);
      return status;
    } catch (error) {
      console.error('Error checking LLM status:', error);
      const fallbackStatus: LLMStatus = {
        available: false,
        provider: { provider: 'unknown' }
      };
      this.statusState.set(fallbackStatus);
      return fallbackStatus;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/llm/models');
      const response = await this.httpService.get<HttpResponse<ModelsResponse>>(url);
      
      const data = this.httpService.extractApiData(response);
      return data.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  getLoadingState() {
    return this.loadingState.asReadonly();
  }

  getStatusState() {
    return this.statusState.asReadonly();
  }

  isAvailable(): boolean {
    return this.statusState()?.available || false;
  }
}