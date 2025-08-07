import { Injectable, signal } from '@angular/core';

export interface TopicItem {
  name: string;
  timestamp: Date;
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
          timestamp: new Date(t.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load topic history', e);
      }
    }
  }
}
