import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TopicService } from '@eristic/app/services/topic';
import { DebaterService, Debater } from '@eristic/app/services/debater.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  topic = '';
  selectedDebaterId = signal<string | null>('default');
  isGenerating = signal<boolean>(false);
  
  private router = inject(Router);
  private topicService = inject(TopicService);
  private debaterService = inject(DebaterService);
  
  // Get active debaters for the dropdown
  get activeDebaters(): Debater[] {
    return this.debaterService.getDebatersSync().filter(d => d.isActive);
  }

  getSelectedDebaterName(): string {
    const debaterId = this.selectedDebaterId();
    if (!debaterId || debaterId === 'default') {
      return 'Default Assistant';
    }
    const debater = this.activeDebaters.find(d => d.id === debaterId);
    return debater?.name || 'Unknown Debater';
  }

  async onTopicSubmit() {
    if (this.topic.trim() && !this.isGenerating()) {
      const debaterId = this.selectedDebaterId();
      this.isGenerating.set(true);
      
      try {
        // Generate topic content immediately with selected debater
        await this.topicService.generateTopicContent(this.topic.trim(), debaterId === 'default' ? undefined : debaterId || undefined);
        
        // Navigate to the generated topic
        this.router.navigate(['/topic', this.topic.trim()]);
      } catch (error) {
        console.error('Failed to generate topic:', error);
        // Navigate anyway - topic page will handle the error
        this.router.navigate(['/topic', this.topic.trim()], {
          state: { debaterId: debaterId }
        });
      } finally {
        this.isGenerating.set(false);
      }
    }
  }

  onDebaterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    
    if (value === 'create-new') {
      // Navigate to debaters page to create a new debater
      this.router.navigate(['/debaters'], { 
        queryParams: { action: 'create' } 
      });
      // Reset selection to default
      this.selectedDebaterId.set('default');
      select.value = 'default';
    } else {
      this.selectedDebaterId.set(value || 'default');
    }
  }
}
