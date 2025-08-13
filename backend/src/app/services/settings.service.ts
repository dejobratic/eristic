import { SettingsRepository } from '@eristic/infrastructure/database/repositories';
import { DebateSettings, UserSettings, DEFAULT_DEBATE_SETTINGS } from '@eristic/app/types/debate.types';
import { ValidationException } from '@eristic/app/types/exceptions.types';

export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  async getDebateSettings(): Promise<DebateSettings> {
    try {
      const userSettings = await this.settingsRepository.getUserSettings();
      return userSettings ? userSettings.debateSettings : DEFAULT_DEBATE_SETTINGS;
    } catch (error) {
      // If no settings exist, return defaults
      return DEFAULT_DEBATE_SETTINGS;
    }
  }

  async updateDebateSettings(settings: DebateSettings): Promise<void> {
    this.validateDebateSettings(settings);
    await this.settingsRepository.updateDebateSettings(settings);
  }

  async resetDebateSettings(): Promise<void> {
    await this.settingsRepository.updateDebateSettings(DEFAULT_DEBATE_SETTINGS);
  }

  private validateDebateSettings(settings: DebateSettings): void {
    if (settings.numDebaters < 2 || settings.numDebaters > 5) {
      throw new ValidationException('Number of debaters must be between 2 and 5');
    }
    
    if (settings.numRounds < 1 || settings.numRounds > 10) {
      throw new ValidationException('Number of rounds must be between 1 and 10');
    }
    
    if (!['fixed', 'random', 'moderator-selected'].includes(settings.turnOrder)) {
      throw new ValidationException('Turn order must be fixed, random, or moderator-selected');
    }
    
    if (settings.responseTimeout && (settings.responseTimeout < 1 || settings.responseTimeout > 60)) {
      throw new ValidationException('Response timeout must be between 1 and 60 minutes');
    }
    
    if (settings.maxResponseLength && (settings.maxResponseLength < 100 || settings.maxResponseLength > 5000)) {
      throw new ValidationException('Max response length must be between 100 and 5000 characters');
    }
  }
}