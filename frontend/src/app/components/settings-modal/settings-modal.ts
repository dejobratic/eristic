import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThemeService, Theme } from '@eristic/app/services/theme';

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.css'
})
export class SettingsModal {
  // Services
  private themeService = inject(ThemeService);

  // Outputs
  close = output<void>();

  // Theme state
  currentTheme = this.themeService.getTheme();

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  closeModal() {
    this.close.emit();
  }

  // Handle backdrop click
  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}