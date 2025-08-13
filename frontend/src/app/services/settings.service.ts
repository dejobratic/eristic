import { Injectable, signal, inject } from '@angular/core';

import { HttpService, HttpResponse } from '@eristic/app/services/http.service';
import { DebateSettings, DEFAULT_DEBATE_SETTINGS } from '@eristic/app/types/debate.types';
import { environment } from '@eristic/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private httpService = inject(HttpService);
  private debateSettings = signal<DebateSettings>(DEFAULT_DEBATE_SETTINGS);
  private loadingState = signal<boolean>(false);
  private apiUrl = environment.backendUrl;

  constructor() {
    this.loadSettings();
  }

  async getDebateSettings(): Promise<DebateSettings> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/settings/debate');
      const response = await this.httpService.get<HttpResponse<DebateSettings>>(url);
      const settings = this.httpService.extractApiData(response);
      
      this.debateSettings.set(settings);
      return settings;
    } catch (error) {
      console.error('Failed to get debate settings:', error);
      // Return current cached settings or defaults
      return this.debateSettings();
    }
  }

  async updateDebateSettings(settings: DebateSettings): Promise<void> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/settings/debate');
      await this.httpService.put<HttpResponse<any>, DebateSettings>(url, settings);
      
      // Update local cache
      this.debateSettings.set(settings);
    } catch (error) {
      console.error('Failed to update debate settings:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async resetDebateSettings(): Promise<void> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/settings/debate/reset');
      await this.httpService.post<HttpResponse<any>, {}>(url, {});
      
      // Update local cache with defaults
      this.debateSettings.set(DEFAULT_DEBATE_SETTINGS);
    } catch (error) {
      console.error('Failed to reset debate settings:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  getDebateSettingsSync(): DebateSettings {
    return this.debateSettings();
  }

  getLoadingState() {
    return this.loadingState.asReadonly();
  }

  private async loadSettings() {
    try {
      await this.getDebateSettings();
    } catch (error) {
      // Silently fail and use defaults
      console.warn('Could not load settings, using defaults');
    }
  }
}