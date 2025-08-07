import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MobileMenuButton } from '@eristic/components/mobile-menu-button/mobile-menu-button';
import { SidePanel } from '@eristic/components/side-panel/side-panel';
import { TopicService } from '@eristic/services/topic';

@Component({
  selector: 'app-topic-details',
  imports: [MobileMenuButton, SidePanel],
  templateUrl: './topic-details.html',
  styleUrl: './topic-details.css'
})
export class TopicDetails implements OnInit {
  topic: string = '';
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topicService = inject(TopicService);

  ngOnInit() {
    this.topic = this.route.snapshot.paramMap.get('topic') || '';
    if (this.topic) {
      this.topicService.addTopic(this.topic);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
