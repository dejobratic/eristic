import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { DebateService } from '@eristic/app/services/debate.service';
import { DebaterService } from '@eristic/app/services/debater.service';
import { SidebarService } from '@eristic/app/services/sidebar.service';
import { LLMService } from '@eristic/app/services/llm.service';

interface RecentDebate {
  id: string;
  topic: string;
  timestamp: Date;
  status: string;
  participantCount: number;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private debateService = inject(DebateService);
  private debaterService = inject(DebaterService);
  private sidebarService = inject(SidebarService);
  private llmService = inject(LLMService);
  private router = inject(Router);

  isCollapsed = this.sidebarService.getIsCollapsed();
  recentDebates = signal<RecentDebate[]>([]);
  filteredDebates = signal<RecentDebate[]>([]);
  searchTerm = '';
  isRefreshing = signal(false);
  llmStatus = this.llmService.getStatusState();

  constructor() {
    // Automatically update when debates change in the service
    effect(() => {
      const debates = this.debateService.getDebates()();
      this.updateRecentDebates(debates);
    });
  }

  async ngOnInit() {
    await this.loadRecentDebates();
    this.handleResponsiveBehavior();
    window.addEventListener('resize', () => this.handleResponsiveBehavior());
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        this.focusSearch();
      }
      
      // Escape to clear search when search is focused
      if (event.key === 'Escape' && this.searchTerm) {
        this.clearSearch();
      }
    });
  }

  private focusSearch() {
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  private handleResponsiveBehavior() {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      // Always expanded on desktop
      this.sidebarService.setSidebarCollapsed(false);
    } else {
      // Start collapsed on mobile
      this.sidebarService.setSidebarCollapsed(true);
    }
  }

  private async loadRecentDebates() {
    try {
      // Always refresh from database on load
      await this.debateService.refreshDebates();
      // The effect will automatically update when the service signal changes
    } catch (error) {
      console.error('Failed to load recent debates:', error);
    }
  }

  private updateRecentDebates(debates: any[]) {
    const recent = debates
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Sort by most recently updated
      .slice(0, 5) // Get 5 most recent
      .map(debate => ({
        id: debate.id,
        topic: debate.topic,
        timestamp: new Date(debate.updatedAt), // Use updatedAt instead of createdAt
        status: debate.status,
        participantCount: debate.settings.numDebaters
      }));
    
    this.recentDebates.set(recent);
    
    // Update filtered list if no search term
    if (!this.searchTerm) {
      this.filteredDebates.set(recent);
    } else {
      // Re-apply current filter
      this.filterDebates();
    }
  }


  toggleCollapse() {
    // Only allow toggle on mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.sidebarService.toggleSidebar();
    }
  }

  navigateToDebate(debateId: string) {
    // Close sidebar on mobile when navigating to a debate
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.sidebarService.setSidebarCollapsed(true);
    }
    
    this.router.navigate(['/debate', debateId]);
  }

  async deleteDebate(debateId: string, topic: string) {
    if (confirm(`Are you sure you want to delete the debate "${topic}"?`)) {
      try {
        await this.debateService.deleteDebate(debateId);
        await this.loadRecentDebates(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete debate:', error);
        alert('Failed to delete debate. Please try again.');
      }
    }
  }

  async refreshRecentDebates() {
    this.isRefreshing.set(true);
    try {
      await this.debateService.refreshDebates();
    } finally {
      // Small delay for visual feedback
      setTimeout(() => this.isRefreshing.set(false), 300);
    }
  }




  filterDebates() {
    const searchTerm = this.searchTerm.toLowerCase().trim();
    const debates = this.recentDebates();
    
    if (!searchTerm) {
      this.filteredDebates.set(debates);
      return;
    }
    
    const filtered = debates.filter(debate => 
      debate.topic.toLowerCase().includes(searchTerm) ||
      debate.status.toLowerCase().includes(searchTerm)
    );
    
    this.filteredDebates.set(filtered);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredDebates.set(this.recentDebates());
  }

  isLLMOnline() {
    return this.llmStatus()?.available || false;
  }

  closeOnMobile() {
    // Close sidebar on mobile when navigating
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.sidebarService.setSidebarCollapsed(true);
    }
  }
}