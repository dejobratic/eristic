import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopicService } from '../../services/topic';
import { SidePanel } from '../../components/side-panel/side-panel';

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
