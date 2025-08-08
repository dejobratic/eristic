import { Injectable, signal } from '@angular/core';

import { LLMResponse } from '@eristic/app/services/llm.service';

export interface TopicItem {
  name: string;
  timestamp: Date;
  llmResponse?: LLMResponse;
  hasRequestedLLMResponse?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private topics = signal<TopicItem[]>([]);

  constructor() {
    this.loadTopics();
  }

  addTopic(name: string) {
    const newTopic: TopicItem = {
      name,
      timestamp: new Date()
    };
    
    const currentTopics = this.topics();
    const existingIndex = currentTopics.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
    
    if (existingIndex >= 0) {
      currentTopics[existingIndex].timestamp = new Date();
    } else {
      currentTopics.push(newTopic);
    }
    
    this.topics.set([...currentTopics]);
    this.saveTopics();
  }

  getTopics() {
    return this.topics.asReadonly();
  }

  deleteTopic(name: string) {
    const currentTopics = this.topics();
    const filteredTopics = currentTopics.filter(topic => topic.name !== name);
    this.topics.set(filteredTopics);
    this.saveTopics();
  }

  renameTopic(oldName: string, newName: string) {
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
      this.saveTopics();
      return true;
    }
    
    return false;
  }

  storeLLMResponse(topicName: string, response: LLMResponse) {
    const currentTopics = this.topics();
    const topicIndex = currentTopics.findIndex(t => t.name.toLowerCase() === topicName.toLowerCase());
    
    if (topicIndex >= 0) {
      currentTopics[topicIndex].llmResponse = response;
      currentTopics[topicIndex].hasRequestedLLMResponse = true;
      this.topics.set([...currentTopics]);
      this.saveTopics();
    }
  }

  getLLMResponse(topicName: string): LLMResponse | null {
    const topic = this.topics().find(t => t.name.toLowerCase() === topicName.toLowerCase());
    return topic?.llmResponse || null;
  }

  hasRequestedLLMResponse(topicName: string): boolean {
    const topic = this.topics().find(t => t.name.toLowerCase() === topicName.toLowerCase());
    return topic?.hasRequestedLLMResponse || false;
  }

  clearLLMResponse(topicName: string) {
    const currentTopics = this.topics();
    const topicIndex = currentTopics.findIndex(t => t.name.toLowerCase() === topicName.toLowerCase());
    
    if (topicIndex >= 0) {
      delete currentTopics[topicIndex].llmResponse;
      currentTopics[topicIndex].hasRequestedLLMResponse = false;
      this.topics.set([...currentTopics]);
      this.saveTopics();
    }
  }

  markLLMResponseRequested(topicName: string) {
    const currentTopics = this.topics();
    const topicIndex = currentTopics.findIndex(t => t.name.toLowerCase() === topicName.toLowerCase());
    
    if (topicIndex >= 0) {
      currentTopics[topicIndex].hasRequestedLLMResponse = true;
      this.topics.set([...currentTopics]);
      this.saveTopics();
    }
  }

  private saveTopics() {
    localStorage.setItem('topic-history', JSON.stringify(this.topics()));
  }

  private loadTopics() {
    const saved = localStorage.getItem('topic-history');
    if (saved) {
      try {
        const topics = JSON.parse(saved);
        this.topics.set(topics.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
          llmResponse: t.llmResponse ? {
            ...t.llmResponse,
            timestamp: new Date(t.llmResponse.timestamp)
          } : undefined
        })));
      } catch (e) {
        console.error('Failed to load topic history', e);
      }
    }
  }
}
