import { Injectable, signal, inject } from '@angular/core';

import { HttpService, HttpResponse } from '@eristic/app/services/http.service';
import { LLMResponse } from '@eristic/app/services/llm.service';
import { environment } from '@eristic/environments/environment';

export interface TopicItem {
  id: string;
  name: string;
  timestamp: Date;
  llmResponse?: LLMResponse;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private httpService = inject(HttpService);
  private topics = signal<TopicItem[]>([]);
  private loadingState = signal<boolean>(false);
  private apiUrl = environment.backendUrl;

  constructor() {
    this.loadTopicsFromDatabase();
  }

  async generateTopicContent(name: string): Promise<TopicItem> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/topics');
      const response = await this.httpService.post<HttpResponse<TopicItem>, { topic: string }>(
        url, 
        { topic: name }
      );
      
      const topicItem = this.httpService.extractApiData(response);
      
      // Process dates
      const processedTopicItem = {
        ...topicItem,
        timestamp: new Date(topicItem.timestamp),
        createdAt: new Date(topicItem.createdAt),
        updatedAt: new Date(topicItem.updatedAt),
        llmResponse: topicItem.llmResponse ? {
          ...topicItem.llmResponse,
          timestamp: new Date(topicItem.llmResponse.timestamp)
        } : undefined
      };
      
      // Update local cache
      this.updateTopicCache(processedTopicItem);
      
      return processedTopicItem;
    } catch (error) {
      console.error('Failed to generate topic content:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  addTopic(name: string) {
    // Topics are now managed by the backend when LLM responses are generated
    // This method is kept for compatibility but doesn't create topics directly
    console.log(`Topic "${name}" will be created when LLM response is generated`);
  }

  getTopics() {
    return this.topics.asReadonly();
  }

  async deleteTopic(name: string) {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/topics/${encodeURIComponent(name)}`);
      const response = await this.httpService.delete<HttpResponse<any>>(url);
      this.httpService.extractApiData(response);
      
      // Update local state
      const currentTopics = this.topics();
      const filteredTopics = currentTopics.filter(topic => topic.name !== name);
      this.topics.set(filteredTopics);
    } catch (error) {
      console.error('Failed to delete topic:', error);
      throw error;
    }
  }

  async renameTopic(oldName: string, newName: string): Promise<boolean> {
    // Note: Renaming topics requires backend support
    // For now, keep the frontend-only logic as a fallback
    if (!newName.trim() || oldName === newName) return false;
    
    const currentTopics = this.topics();
    const existingTopic = currentTopics.find(t => t.name.toLowerCase() === newName.toLowerCase());
    
    if (existingTopic && existingTopic.name !== oldName) {
      return false;
    }
    
    const topicIndex = currentTopics.findIndex(t => t.name === oldName);
    if (topicIndex >= 0) {
      currentTopics[topicIndex].name = newName.trim();
      this.topics.set([...currentTopics]);
      // TODO: Implement backend rename endpoint
      console.warn('Topic rename is local only - backend support needed');
      return true;
    }
    
    return false;
  }

  storeLLMResponse(topicName: string, response: LLMResponse) {
    // Update local cache when LLM response is received
    const currentTopics = this.topics();
    const topicIndex = currentTopics.findIndex(t => t.name.toLowerCase() === topicName.toLowerCase());
    
    if (topicIndex >= 0) {
      currentTopics[topicIndex].llmResponse = response;
      currentTopics[topicIndex].timestamp = response.timestamp;
      this.topics.set([...currentTopics]);
    } else {
      // If topic doesn't exist locally, refresh from database
      this.loadTopicsFromDatabase();
    }
  }

  async getTopic(topicName: string): Promise<TopicItem | null> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/topics/${encodeURIComponent(topicName)}`);
      const response = await this.httpService.get<HttpResponse<TopicItem>>(url);
      return this.httpService.extractApiData(response);
    } catch (error) {
      console.error('Failed to get topic:', error);
      return null;
    }
  }

  getLLMResponse(topicName: string): LLMResponse | null {
    const topic = this.topics().find(t => t.name.toLowerCase() === topicName.toLowerCase());
    return topic?.llmResponse || null;
  }

  private async loadTopicsFromDatabase() {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/topics');
      const response = await this.httpService.get<HttpResponse<TopicItem[]>>(url);
      const topics = this.httpService.extractApiData(response);
      
      // Convert date strings to Date objects
      const processedTopics = topics.map(topic => ({
        ...topic,
        timestamp: new Date(topic.timestamp),
        createdAt: new Date(topic.createdAt),
        updatedAt: new Date(topic.updatedAt),
        llmResponse: topic.llmResponse ? {
          ...topic.llmResponse,
          timestamp: new Date(topic.llmResponse.timestamp)
        } : undefined
      }));
      
      this.topics.set(processedTopics);
    } catch (error) {
      console.error('Failed to load topics from database:', error);
      // Fallback to localStorage if database is unavailable
      this.loadTopicsFromLocalStorage();
    }
  }

  private loadTopicsFromLocalStorage() {
    const saved = localStorage.getItem('topic-history');
    if (saved) {
      try {
        const topics = JSON.parse(saved);
        // Convert old format to new format
        const convertedTopics = topics.map((t: any, index: number) => ({
          id: t.id || `local-${index}`,
          name: t.name,
          timestamp: new Date(t.timestamp),
          createdAt: new Date(t.timestamp),
          updatedAt: new Date(t.timestamp),
          llmResponse: t.llmResponse ? {
            ...t.llmResponse,
            timestamp: new Date(t.llmResponse.timestamp)
          } : undefined
        }));
        this.topics.set(convertedTopics);
      } catch (e) {
        console.error('Failed to load topic history from localStorage', e);
      }
    }
  }

  async refreshTopics() {
    await this.loadTopicsFromDatabase();
  }

  /**
   * Get topics synchronously from cache
   */
  getTopicsSync(): TopicItem[] {
    return this.topics();
  }

  /**
   * Update local cache with a new or updated topic
   */
  updateTopicCache(topicItem: TopicItem) {
    const currentTopics = this.topics();
    const existingIndex = currentTopics.findIndex(t => t.name.toLowerCase() === topicItem.name.toLowerCase());
    
    if (existingIndex >= 0) {
      // Update existing topic
      currentTopics[existingIndex] = topicItem;
    } else {
      // Add new topic to the beginning of the list
      currentTopics.unshift(topicItem);
    }
    
    this.topics.set([...currentTopics]);
  }

  /**
   * Get loading state
   */
  getLoadingState() {
    return this.loadingState.asReadonly();
  }
}