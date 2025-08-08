import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ThemeToggle } from '@eristic/app/components/theme-toggle/theme-toggle';
import { MobileNavService } from '@eristic/app/services/mobile-nav';
import { TopicService } from '@eristic/app/services/topic';

@Component({
  selector: 'app-side-panel',
  imports: [CommonModule, ThemeToggle],
  templateUrl: './side-panel.html',
  styleUrl: './side-panel.css'
})
export class SidePanel {
  private topicService = inject(TopicService);
  private router = inject(Router);
  private mobileNavService = inject(MobileNavService);

  topics = this.topicService.getTopics();
  isOpen = this.mobileNavService.getIsOpen();
  isMobile = this.mobileNavService.getIsMobile();

  navigateToTopic(topicName: string) {
    this.router.navigate(['/topic', topicName]);
    // Close mobile nav after navigation
    if (this.isMobile()) {
      this.mobileNavService.close();
    }
  }

  navigateHome() {
    this.router.navigate(['/']);
    // Close mobile nav after navigation
    if (this.isMobile()) {
      this.mobileNavService.close();
    }
  }

  closeMobileNav() {
    this.mobileNavService.close();
  }

  deleteTopic(event: Event, topicName: string) {
    event.stopPropagation();
    
    const confirmed = confirm(`Are you sure you want to delete "${topicName}" from your topic history?`);
    if (confirmed) {
      this.topicService.deleteTopic(topicName);
    }
  }

  renameTopic(event: Event, oldName: string) {
    event.stopPropagation();
    
    const newName = prompt(`Rename topic "${oldName}" to:`, oldName);
    if (newName !== null) {
      const success = this.topicService.renameTopic(oldName, newName);
      if (!success) {
        if (newName.trim() === '') {
          alert('Topic name cannot be empty.');
        } else {
          alert('A topic with this name already exists.');
        }
      }
    }
  }
}
