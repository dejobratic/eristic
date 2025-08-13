import { UserSettings, DebateSettings } from '@eristic/app/types/debate.types';

// Abstract repository interface for user settings
export abstract class SettingsRepository {
  abstract getUserSettings(): Promise<UserSettings | null>;
  abstract updateDebateSettings(settings: DebateSettings): Promise<void>;
  abstract createDefaultSettings(): Promise<UserSettings>;
}