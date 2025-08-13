import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ThemeService } from '@eristic/app/services/theme';
import { LLMService } from '@eristic/app/services/llm.service';
import { SettingsModal } from '@eristic/app/components/settings-modal/settings-modal';

@Component({
  selector: 'app-header',
  imports: [CommonModule, SettingsModal],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  private themeService = inject(ThemeService);
  private llmService = inject(LLMService);
  private router = inject(Router);
  
  currentTheme = this.themeService.getTheme();
  llmStatus = this.llmService.getStatusState();
  isMobileMenuOpen = signal(false);
  isSettingsModalOpen = signal(false);

  openSettings() {
    this.isSettingsModalOpen.set(true);
    this.closeMobileMenu();
  }

  closeSettings() {
    this.isSettingsModalOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToDebaters() {
    this.router.navigate(['/debaters']);
    this.closeMobileMenu();
  }

  get isLLMOnline() {
    return this.llmStatus()?.available || false;
  }
}