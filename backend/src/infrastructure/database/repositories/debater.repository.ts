import { Debater } from '@eristic/app/types/debater.types';

export abstract class DebaterRepository {
  abstract createDebater(debater: Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debater>;
  abstract getDebater(id: string): Promise<Debater | null>;
  abstract getDebaterByName(name: string): Promise<Debater | null>;
  abstract getAllDebaters(): Promise<Debater[]>;
  abstract getActiveDebaters(): Promise<Debater[]>;
  abstract updateDebater(id: string, updates: Partial<Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Debater | null>;
  abstract deleteDebater(id: string): Promise<void>;
}