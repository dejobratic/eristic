import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { LLMService, LLMResponse } from '@eristic/app/services/llm.service';
import { TopicService } from '@eristic/app/services/topic';
import { DebaterService } from '@eristic/app/services/debater.service';

@Component({
  selector: 'app-topic-details',
  imports: [CommonModule],
  templateUrl: './topic-details.html',
  styleUrl: './topic-details.css'
})
export class TopicDetails implements OnInit, OnDestroy {
  topic: string = '';
  llmResponse = signal<LLMResponse | null>(null);
  error = signal<string | null>(null);
  selectedDebaterId = signal<string | null>(null);
  hasGeneratedResponse = signal<boolean>(false);
  isRegenerating = signal<boolean>(false);
  useDefaultForRegeneration = signal<boolean>(false);
  showScrollToTop = signal<boolean>(false);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topicService = inject(TopicService);
  private llmService = inject(LLMService);
  private debaterService = inject(DebaterService);
  private routeSubscription?: Subscription;

  ngOnInit() {
    // Get debater selection from navigation state
    const navigation = this.router.getCurrentNavigation();
    const debaterId = navigation?.extras?.state?.['debaterId'];
    if (debaterId) {
      this.selectedDebaterId.set(debaterId);
    }
    
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

    // Listen for scroll events to show/hide scroll-to-top button
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  private async loadTopicData() {
    // Reset state for new topic
    this.llmResponse.set(null);
    this.error.set(null);
    this.hasGeneratedResponse.set(false);
    this.isRegenerating.set(false);
    
    // First check local cache
    const cachedResponse = this.topicService.getLLMResponse(this.topic);
    
    if (cachedResponse) {
      this.llmResponse.set(cachedResponse);
      this.hasGeneratedResponse.set(true);
      // Set the debater from cached topic if available
      const cachedTopic = this.topicService.getTopicsSync().find(t => t.name === this.topic);
      if (cachedTopic?.debaterId) {
        this.selectedDebaterId.set(cachedTopic.debaterId);
      }
    } else {
      // If no local cache, try to load from database
      try {
        const topicData = await this.topicService.getTopic(this.topic);
        if (topicData?.llmResponse) {
          this.llmResponse.set(topicData.llmResponse);
          this.hasGeneratedResponse.set(true);
          this.topicService.storeLLMResponse(this.topic, topicData.llmResponse);
          // Set the debater from database topic if available
          if (topicData.debaterId) {
            this.selectedDebaterId.set(topicData.debaterId);
          }
        } else {
          // No cached response found
          this.hasGeneratedResponse.set(false);
          
          // Don't auto-generate here anymore - generation should happen from home page
          // If user comes directly to this page, they can manually generate
        }
      } catch (error) {
        console.error('Failed to load topic from database:', error);
        // Database failed - user can manually generate if needed
        this.hasGeneratedResponse.set(false);
      }
    }
  }

  async generateLLMResponse() {
    this.error.set(null);
    
    try {
      const debaterId = this.selectedDebaterId();
      const topicItem = await this.topicService.generateTopicContent(this.topic, debaterId || undefined);
      if (topicItem.llmResponse) {
        this.llmResponse.set(topicItem.llmResponse);
        this.hasGeneratedResponse.set(true);
        // Update selected debater based on what was actually used
        if (topicItem.debaterId) {
          this.selectedDebaterId.set(topicItem.debaterId);
        }
      } else {
        throw new Error('No LLM response in generated topic');
      }
    } catch (error) {
      console.error('Failed to generate LLM response:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to generate response');
    }
  }

  async regenerateResponse() {
    // Clear local cache and regenerate with option to change debater
    this.llmResponse.set(null);
    
    // Determine which debater to use for regeneration
    const debaterIdForRegeneration = this.useDefaultForRegeneration() ? null : this.selectedDebaterId();
    
    try {
      const topicItem = await this.topicService.generateTopicContent(this.topic, debaterIdForRegeneration || undefined);
      if (topicItem.llmResponse) {
        this.llmResponse.set(topicItem.llmResponse);
        this.hasGeneratedResponse.set(true);
        // Update selected debater based on what was actually used (unless using default override)
        if (!this.useDefaultForRegeneration() && topicItem.debaterId) {
          this.selectedDebaterId.set(topicItem.debaterId);
        }
      } else {
        throw new Error('No LLM response in generated topic');
      }
    } catch (error) {
      console.error('Failed to regenerate LLM response:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to regenerate response');
    } finally {
      this.isRegenerating.set(false);
      this.useDefaultForRegeneration.set(false);
    }
  }

  startRegeneration() {
    // Enable debater selection for regeneration
    this.isRegenerating.set(true);
    this.useDefaultForRegeneration.set(false);
  }

  cancelRegeneration() {
    // Cancel regeneration and go back to locked state
    this.isRegenerating.set(false);
    this.useDefaultForRegeneration.set(false);
  }

  onDefaultDebaterToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.useDefaultForRegeneration.set(checkbox.checked);
    // When checkbox is checked, temporarily override selected debater for regeneration
    if (checkbox.checked) {
      // Don't change the actual selectedDebaterId, just use default for regeneration
    }
  }

  getRegenerationDebaterName(): string {
    if (this.useDefaultForRegeneration()) {
      return 'Default Assistant';
    }
    return this.getDebaterName();
  }

  get isLoading() {
    return this.topicService.getLoadingState();
  }

  get isLLMAvailable() {
    return this.llmService.isAvailable();
  }

  onDebaterChanged(debaterId: string | null) {
    this.selectedDebaterId.set(debaterId);
    // Only auto-regenerate if we're in regeneration mode
    if (this.isRegenerating()) {
      this.regenerateResponse();
    }
  }

  getDebaterName(): string {
    const debaterId = this.selectedDebaterId();
    if (!debaterId) return 'Default Assistant';
    
    if (debaterId === 'default') return 'Default Assistant';
    
    const debaters = this.debaterService.getDebatersSync();
    const debater = debaters.find(d => d.id === debaterId);
    return debater?.name || 'Unknown Debater';
  }

  goBack() {
    this.router.navigate(['/']);
  }

  onScroll() {
    // Show scroll-to-top button when user scrolls down 300px
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.showScrollToTop.set(scrollTop > 300);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
