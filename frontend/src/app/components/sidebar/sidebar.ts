import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TopicService } from '@eristic/app/services/topic';
import { DebaterService } from '@eristic/app/services/debater.service';

interface RecentTopic {
  name: string;
  timestamp: Date;
  debaterName?: string;
  isEditing?: boolean;
  originalName?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private topicService = inject(TopicService);
  private debaterService = inject(DebaterService);
  private router = inject(Router);

  isCollapsed = signal(false);
  recentTopics = signal<RecentTopic[]>([]);
  filteredTopics = signal<RecentTopic[]>([]);
  searchTerm = '';
  isRefreshing = signal(false);

  async ngOnInit() {
    await this.loadRecentTopics();
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
      this.isCollapsed.set(false);
    } else {
      // Start collapsed on mobile
      this.isCollapsed.set(true);
    }
  }

  private async loadRecentTopics() {
    try {
      // Always refresh from database on load
      await this.topicService.refreshTopics();
      
      const topics = this.topicService.getTopicsSync();
      const debaters = this.debaterService.getDebatersSync();
      
      const recent = topics
        .slice(0, 5) // Get 5 most recent
        .map(topic => ({
          name: topic.name,
          timestamp: new Date(topic.timestamp),
          debaterName: topic.debaterId ? 
            debaters.find(d => d.id === topic.debaterId)?.name : 
            'Default Assistant',
          isEditing: false,
          originalName: topic.name
        }));
      
      this.recentTopics.set(recent);
      this.filteredTopics.set(recent);
    } catch (error) {
      console.error('Failed to load recent topics:', error);
    }
  }


  toggleCollapse() {
    // Only allow toggle on mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.isCollapsed.update(collapsed => !collapsed);
    }
  }

  navigateToTopic(topicName: string) {
    this.router.navigate(['/topic', topicName]);
  }

  async deleteTopic(topicName: string) {
    if (confirm(`Are you sure you want to delete the topic "${topicName}"?`)) {
      try {
        await this.topicService.deleteTopic(topicName);
        await this.loadRecentTopics(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete topic:', error);
        alert('Failed to delete topic. Please try again.');
      }
    }
  }

  async refreshRecentTopics() {
    this.isRefreshing.set(true);
    try {
      await this.loadRecentTopics();
    } finally {
      // Small delay for visual feedback
      setTimeout(() => this.isRefreshing.set(false), 300);
    }
  }

  startRename(topicName: string) {
    const topics = this.recentTopics();
    const updatedTopics = topics.map(topic => 
      topic.name === topicName 
        ? { ...topic, isEditing: true }
        : { ...topic, isEditing: false }
    );
    this.recentTopics.set(updatedTopics);
  }

  async saveRename(oldName: string, newName: string) {
    if (!newName.trim() || newName.trim() === oldName) {
      this.cancelRename(oldName);
      return;
    }

    try {
      await this.topicService.renameTopic(oldName, newName.trim());
      await this.loadRecentTopics(); // Refresh the list
    } catch (error) {
      console.error('Failed to rename topic:', error);
      alert('Failed to rename topic. Please try again.');
      this.cancelRename(oldName);
    }
  }

  cancelRename(topicName: string) {
    const topics = this.recentTopics();
    const updatedTopics = topics.map(topic => 
      topic.originalName === topicName 
        ? { ...topic, isEditing: false, name: topic.originalName! }
        : topic
    );
    this.recentTopics.set(updatedTopics);
    this.filterTopics(); // Update filtered list
  }

  filterTopics() {
    const searchTerm = this.searchTerm.toLowerCase().trim();
    const topics = this.recentTopics();
    
    if (!searchTerm) {
      this.filteredTopics.set(topics);
      return;
    }
    
    const filtered = topics.filter(topic => 
      topic.name.toLowerCase().includes(searchTerm) ||
      (topic.debaterName && topic.debaterName.toLowerCase().includes(searchTerm))
    );
    
    this.filteredTopics.set(filtered);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredTopics.set(this.recentTopics());
  }
}