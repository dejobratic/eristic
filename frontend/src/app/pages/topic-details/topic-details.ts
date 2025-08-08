import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
export class TopicDetails implements OnInit {
  topic: string = '';
  llmResponse = signal<LLMResponse | null>(null);
  error = signal<string | null>(null);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topicService = inject(TopicService);
  private llmService = inject(LLMService);

  ngOnInit() {
    this.topic = this.route.snapshot.paramMap.get('topic') || '';
    if (this.topic) {
      this.topicService.addTopic(this.topic);
      this.loadCachedResponseOrGenerate();
    }
  }

  private loadCachedResponseOrGenerate() {
    const cachedResponse = this.topicService.getLLMResponse(this.topic);
    
    if (cachedResponse) {
      this.llmResponse.set(cachedResponse);
    } else {
      // If no cached response, always generate (whether new topic or retry)
      this.generateLLMResponse();
    }
  }

  async generateLLMResponse() {
    this.error.set(null);
    this.topicService.markLLMResponseRequested(this.topic);
    
    try {
      const response = await this.llmService.generateTopicResponse(this.topic);
      this.llmResponse.set(response);
      this.topicService.storeLLMResponse(this.topic, response);
    } catch (error) {
      console.error('Failed to generate LLM response:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to generate response');
    }
  }

  async regenerateResponse() {
    this.topicService.clearLLMResponse(this.topic);
    await this.generateLLMResponse();
  }

  get isLoading() {
    return this.llmService.getLoadingState();
  }

  get isLLMAvailable() {
    return this.llmService.isAvailable();
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
