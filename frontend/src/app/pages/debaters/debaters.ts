import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
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
  
  @ViewChild(DebaterManager) debaterManager!: DebaterManager;
  
  activeDebaters = signal(0);
  totalDebaters = signal(0);
  
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

  refreshStats() {
    this.loadStats();
  }
  
  private async loadStats() {
    try {
      const allDebaters = await this.debaterService.getAllDebaters();
      const activeCount = allDebaters.filter(d => d.isActive).length;
      
      this.totalDebaters.set(allDebaters.length);
      this.activeDebaters.set(activeCount);
    } catch (error) {
      console.error('Failed to load debater stats:', error);
    }
  }
  
  createNewDebater() {
    if (this.debaterManager) {
      this.debaterManager.openCreateForm();
    }
  }
}