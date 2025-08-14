import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ThemeService } from '@eristic/app/services/theme';
import { SidebarService } from '@eristic/app/services/sidebar.service';
import { SettingsModal } from '@eristic/app/components/settings-modal/settings-modal';

@Component({
  selector: 'app-header',
  imports: [CommonModule, SettingsModal],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  private themeService = inject(ThemeService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  
  currentTheme = this.themeService.getTheme();
  isSettingsModalOpen = signal(false);

  toggleSettings() {
    this.isSettingsModalOpen.update(open => !open);
  }

  closeSettings() {
    this.isSettingsModalOpen.set(false);
  }

  toggleMobileMenu() {
    this.sidebarService.toggleSidebar();
  }


  navigateToHome() {
    this.router.navigate(['/']);
  }

  navigateToDebaters() {
    this.router.navigate(['/debaters']);
  }
}