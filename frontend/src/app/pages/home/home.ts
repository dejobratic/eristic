import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SidePanel } from '@eristic/components/side-panel/side-panel';
import { TopicService } from '@eristic/services/topic';

@Component({
  selector: 'app-home',
  imports: [FormsModule, SidePanel],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  protected readonly title = signal('Topic Selector');
  topic = '';
  
  private router = inject(Router);
  private topicService = inject(TopicService);

  onTopicSubmit() {
    if (this.topic.trim()) {
      this.topicService.addTopic(this.topic.trim());
      this.router.navigate(['/topic', this.topic.trim()]);
    }
  }
}
