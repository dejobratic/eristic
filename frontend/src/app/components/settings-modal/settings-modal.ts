import { Component, inject, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '@eristic/app/services/settings.service';
import { ThemeService, Theme } from '@eristic/app/services/theme';
import { DebateSettings } from '@eristic/app/types/debate.types';

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.css'
})
export class SettingsModal implements OnInit {
  // Services
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);

  // Outputs
  close = output<void>();

  // State
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  activeTab = signal<'debate' | 'appearance'>('debate');
  
  // Settings state
  debateSettings = signal<DebateSettings>({
    numDebaters: 2,
    numRounds: 3,
    turnOrder: 'fixed',
    responseTimeout: 5,
    maxResponseLength: 2000
  });

  // Theme state
  currentTheme = this.themeService.getTheme();
  

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.isLoading.set(true);
      const settings = await this.settingsService.getDebateSettings();
      this.debateSettings.set({ ...settings });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveDebateSettings() {
    try {
      this.isSaving.set(true);
      await this.settingsService.updateDebateSettings(this.debateSettings());
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async resetDebateSettings() {
    try {
      this.isSaving.set(true);
      await this.settingsService.resetDebateSettings();
      await this.loadSettings(); // Reload to get defaults
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setActiveTab(tab: 'debate' | 'appearance') {
    this.activeTab.set(tab);
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

  // Update debate settings
  updateNumDebaters(value: number) {
    this.debateSettings.update(settings => ({ ...settings, numDebaters: value }));
  }

  updateNumRounds(value: number) {
    this.debateSettings.update(settings => ({ ...settings, numRounds: value }));
  }

  updateTurnOrder(value: 'fixed' | 'random' | 'moderator-selected') {
    this.debateSettings.update(settings => ({ ...settings, turnOrder: value }));
  }

  updateResponseTimeout(value: number) {
    this.debateSettings.update(settings => ({ ...settings, responseTimeout: value }));
  }

  updateMaxResponseLength(value: number) {
    this.debateSettings.update(settings => ({ ...settings, maxResponseLength: value }));
  }

  // Validation
  isSettingsValid(): boolean {
    const settings = this.debateSettings();
    return (
      settings.numDebaters >= 2 && settings.numDebaters <= 5 &&
      settings.numRounds >= 1 && settings.numRounds <= 10 &&
      (settings.responseTimeout || 0) >= 1 && (settings.responseTimeout || 0) <= 60 &&
      (settings.maxResponseLength || 0) >= 100 && (settings.maxResponseLength || 0) <= 5000
    );
  }
}