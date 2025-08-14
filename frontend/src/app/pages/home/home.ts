import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DebateService } from '@eristic/app/services/debate.service';
import { DebaterService } from '@eristic/app/services/debater.service';
import { Debate } from '@eristic/app/types/debate.types';


@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})

export class Home implements OnInit {
  debates = signal<Debate[]>([]);
  quickTopic = '';
  
  private router = inject(Router);
  private debateService = inject(DebateService);
  private debaterService = inject(DebaterService);

  quickTopics = [
    "AI vs Human Creativity",
    "Universal Basic Income", 
    "Space Exploration Priority",
    "Social Media Regulation",
    "Climate Action"
  ];

  ngOnInit() {
    this.loadRecentDebates();
  }

  async loadRecentDebates() {
    try {
      await this.debateService.refreshDebates();
      this.debates.set(this.debateService.getDebatesSync());
    } catch (error) {
      console.error('Failed to load debates:', error);
    }
  }

  // Set topic from quick suggestions and go directly to setup
  setTopic(topic: string) {
    this.router.navigate(['/debate-setup', topic]);
  }

  // Create debate with topic
  createDebateWithTopic() {
    if (this.quickTopic.trim()) {
      this.router.navigate(['/debate-setup', this.quickTopic.trim()]);
    }
  }

  // Get pending debates (includes active and paused)
  get pendingDebates() {
    return this.debates().filter(d => d.status === 'active' || d.status === 'pending');
  }

  // Get completed debates
  get completedDebates() {
    return this.debates().filter(d => d.status === 'completed');
  }
}
