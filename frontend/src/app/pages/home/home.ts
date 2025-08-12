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
  
  private router = inject(Router);
  private topicService = inject(TopicService);
  private debaterService = inject(DebaterService);
  
  // Get active debaters for the dropdown
  get activeDebaters(): Debater[] {
    return this.debaterService.getDebatersSync().filter(d => d.isActive);
  }

  onTopicSubmit() {
    if (this.topic.trim()) {
      const debaterId = this.selectedDebaterId();
      // Navigate with debater selection
      this.router.navigate(['/topic', this.topic.trim()], {
        state: { debaterId: debaterId }
      });
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
