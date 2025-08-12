import { DebaterRepository } from '@eristic/infrastructure/database/repositories';
import { Debater } from '@eristic/app/types/debater.types';
import { ValidationException, NotFoundException } from '@eristic/app/types/exceptions.types';

export class DebaterService {
  constructor(private debaterRepository: DebaterRepository) {}

  async createDebater(debaterData: Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debater> {
    this.validateDebaterData(debaterData);

    // Check if debater with same name already exists
    const existingDebater = await this.debaterRepository.getDebaterByName(debaterData.name);
    if (existingDebater) {
      throw new ValidationException('A debater with this name already exists');
    }

    return await this.debaterRepository.createDebater(debaterData);
  }

  async getDebater(id: string): Promise<Debater> {
    if (!id || typeof id !== 'string') {
      throw new ValidationException('Debater ID is required and must be a string');
    }

    const debater = await this.debaterRepository.getDebater(id);
    if (!debater) {
      throw new NotFoundException('Debater');
    }
    
    return debater;
  }

  async getDebaterByName(name: string): Promise<Debater> {
    if (!name || typeof name !== 'string') {
      throw new ValidationException('Debater name is required and must be a string');
    }

    const debater = await this.debaterRepository.getDebaterByName(name);
    if (!debater) {
      throw new NotFoundException('Debater');
    }
    
    return debater;
  }

  async getAllDebaters(): Promise<Debater[]> {
    return await this.debaterRepository.getAllDebaters();
  }

  async getActiveDebaters(): Promise<Debater[]> {
    return await this.debaterRepository.getActiveDebaters();
  }

  async updateDebater(id: string, updates: Partial<Omit<Debater, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Debater> {
    if (!id || typeof id !== 'string') {
      throw new ValidationException('Debater ID is required and must be a string');
    }

    // Validate updates if provided
    if (updates.name !== undefined || updates.description !== undefined || 
        updates.model !== undefined || updates.systemPrompt !== undefined) {
      this.validateDebaterData(updates as any, true);
    }

    // If name is being updated, check for conflicts
    if (updates.name) {
      const existingDebater = await this.debaterRepository.getDebaterByName(updates.name);
      if (existingDebater && existingDebater.id !== id) {
        throw new ValidationException('A debater with this name already exists');
      }
    }

    const updatedDebater = await this.debaterRepository.updateDebater(id, updates);
    if (!updatedDebater) {
      throw new NotFoundException('Debater');
    }

    return updatedDebater;
  }

  async deleteDebater(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new ValidationException('Debater ID is required and must be a string');
    }

    // Verify debater exists before deletion
    await this.getDebater(id); // This will throw NotFoundException if not found

    // Don't allow deletion of the default debater
    if (id === 'default') {
      throw new ValidationException('Cannot delete the default debater');
    }

    await this.debaterRepository.deleteDebater(id);
  }

  private validateDebaterData(data: Partial<Debater>, isUpdate = false) {
    if (!isUpdate) {
      // Required fields for creation
      if (!data.name || typeof data.name !== 'string') {
        throw new ValidationException('Debater name is required and must be a string');
      }
      if (!data.description || typeof data.description !== 'string') {
        throw new ValidationException('Debater description is required and must be a string');
      }
      if (!data.model || typeof data.model !== 'string') {
        throw new ValidationException('Debater model is required and must be a string');
      }
      if (!data.systemPrompt || typeof data.systemPrompt !== 'string') {
        throw new ValidationException('Debater system prompt is required and must be a string');
      }
      if (typeof data.isActive !== 'boolean') {
        throw new ValidationException('Debater isActive must be a boolean');
      }
    } else {
      // Validation for updates (only validate provided fields)
      if (data.name !== undefined && (!data.name || typeof data.name !== 'string')) {
        throw new ValidationException('Debater name must be a non-empty string');
      }
      if (data.description !== undefined && (!data.description || typeof data.description !== 'string')) {
        throw new ValidationException('Debater description must be a non-empty string');
      }
      if (data.model !== undefined && (!data.model || typeof data.model !== 'string')) {
        throw new ValidationException('Debater model must be a non-empty string');
      }
      if (data.systemPrompt !== undefined && (!data.systemPrompt || typeof data.systemPrompt !== 'string')) {
        throw new ValidationException('Debater system prompt must be a non-empty string');
      }
      if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        throw new ValidationException('Debater isActive must be a boolean');
      }
    }

    // Common validation for both create and update
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationException('Debater name must be at least 2 characters long');
    }
    if (data.description && data.description.trim().length < 10) {
      throw new ValidationException('Debater description must be at least 10 characters long');
    }
    if (data.systemPrompt && data.systemPrompt.trim().length < 20) {
      throw new ValidationException('Debater system prompt must be at least 20 characters long');
    }
  }
}