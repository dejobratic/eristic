import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { DebaterManager } from '@eristic/app/components/debater-manager/debater-manager';
import { DebaterService } from '@eristic/app/services/debater.service';

@Component({
  selector: 'app-debaters',
  imports: [CommonModule, DebaterManager],
  templateUrl: './debaters.html',
  styleUrl: './debaters.css'
})
export class Debaters implements OnInit {
  private debaterService = inject(DebaterService);
  private route = inject(ActivatedRoute);
  
  activeDebaters = signal(0);
  totalDebaters = signal(0);
  recentlyUsed = signal(0);
  
  ngOnInit() {
    this.loadStats();
    
    // Check for create action from query params
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        // Trigger create debater action
        setTimeout(() => this.createNewDebater(), 100);
      }
    });
  }
  
  private async loadStats() {
    try {
      const allDebaters = await this.debaterService.getAllDebaters();
      const activeCount = allDebaters.filter(d => d.isActive).length;
      
      this.totalDebaters.set(allDebaters.length);
      this.activeDebaters.set(activeCount);
      this.recentlyUsed.set(Math.min(3, activeCount)); // Simple placeholder logic
    } catch (error) {
      console.error('Failed to load debater stats:', error);
    }
  }
  
  createNewDebater() {
    // This will be handled by the debater-manager component
    // We can emit an event or call a method on the child component
    console.log('Create new debater triggered');
  }
}