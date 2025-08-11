import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { MobileMenuButton } from '@eristic/app/components/mobile-menu-button/mobile-menu-button';
import { SidePanel } from '@eristic/app/components/side-panel/side-panel';
import { LLMService, LLMResponse } from '@eristic/app/services/llm.service';
import { TopicService } from '@eristic/app/services/topic';

@Component({
  selector: 'app-topic-details',
  imports: [CommonModule, MobileMenuButton, SidePanel],
  templateUrl: './topic-details.html',
  styleUrl: './topic-details.css'
})
export class TopicDetails implements OnInit, OnDestroy {
  topic: string = '';
  llmResponse = signal<LLMResponse | null>(null);
  error = signal<string | null>(null);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topicService = inject(TopicService);
  private llmService = inject(LLMService);
  private routeSubscription?: Subscription;

  ngOnInit() {
    // Subscribe to route parameter changes to handle topic switching
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const newTopic = params.get('topic') || '';
      if (newTopic && newTopic !== this.topic) {
        this.topic = newTopic;
        this.loadTopicData();
      } else if (newTopic) {
        this.topic = newTopic;
        this.loadTopicData();
      }
    });
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
  }

  private async loadTopicData() {
    // Reset state for new topic
    this.llmResponse.set(null);
    this.error.set(null);
    
    // First check local cache
    const cachedResponse = this.topicService.getLLMResponse(this.topic);
    
    if (cachedResponse) {
      this.llmResponse.set(cachedResponse);
    } else {
      // If no local cache, try to load from database
      try {
        const topicData = await this.topicService.getTopic(this.topic);
        if (topicData?.llmResponse) {
          this.llmResponse.set(topicData.llmResponse);
          this.topicService.storeLLMResponse(this.topic, topicData.llmResponse);
        } else {
          // If no cached response anywhere, generate new one
          this.generateLLMResponse();
        }
      } catch (error) {
        console.error('Failed to load topic from database:', error);
        // If database fails, try to generate new response
        this.generateLLMResponse();
      }
    }
  }

  async generateLLMResponse() {
    this.error.set(null);
    
    try {
      const topicItem = await this.topicService.generateTopicContent(this.topic);
      if (topicItem.llmResponse) {
        this.llmResponse.set(topicItem.llmResponse);
      } else {
        throw new Error('No LLM response in generated topic');
      }
    } catch (error) {
      console.error('Failed to generate LLM response:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to generate response');
    }
  }

  async regenerateResponse() {
    // Clear local cache and regenerate
    this.llmResponse.set(null);
    await this.generateLLMResponse();
  }

  get isLoading() {
    return this.topicService.getLoadingState();
  }

  get isLLMAvailable() {
    return this.llmService.isAvailable();
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
