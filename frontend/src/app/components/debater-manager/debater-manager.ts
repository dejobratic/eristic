import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DebaterService, Debater, CreateDebaterRequest, UpdateDebaterRequest } from '@eristic/app/services/debater.service';
import { LLMService } from '@eristic/app/services/llm.service';

@Component({
  selector: 'app-debater-manager',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './debater-manager.html',
  styleUrl: './debater-manager.css'
})
export class DebaterManager {
  private debaterService = inject(DebaterService);
  private llmService = inject(LLMService);
  
  debaterUpdated = output<void>();
  
  debaters = signal<Debater[]>([]);
  availableModels = signal<string[]>([]);
  showCreateForm = signal<boolean>(false);
  editingDebater = signal<Debater | null>(null);
  formData = signal<Partial<CreateDebaterRequest>>({
    name: '',
    description: '',
    model: 'llama3.2:latest',
    systemPrompt: '',
    isActive: true
  });
  
  formErrors = signal<string[]>([]);
  loading = signal<boolean>(false);
  loadingModels = signal<boolean>(false);

  constructor() {
    this.loadDebaters();
    this.loadAvailableModels();
  }

  async loadDebaters() {
    try {
      const debaters = await this.debaterService.getAllDebaters();
      this.debaters.set(debaters);
    } catch (error) {
      console.error('Failed to load debaters:', error);
    }
  }

  async loadAvailableModels() {
    this.loadingModels.set(true);
    try {
      const models = await this.llmService.getAvailableModels();
      this.availableModels.set(models);
      
      // If we have models and current form model isn't in the list, set the first available one
      const currentModel = this.formData().model;
      if (models.length > 0 && (!currentModel || !models.includes(currentModel))) {
        this.updateFormField('model', models[0]);
      }
    } catch (error) {
      console.error('Failed to load available models:', error);
      // Show error state instead of fallback models
      this.availableModels.set([]);
    } finally {
      this.loadingModels.set(false);
    }
  }

  openCreateForm() {
    this.resetForm();
    this.showCreateForm.set(true);
    this.editingDebater.set(null);
  }

  openEditForm(debater: Debater) {
    this.formData.set({
      name: debater.name,
      description: debater.description,
      model: debater.model,
      systemPrompt: debater.systemPrompt,
      isActive: true
    });
    this.editingDebater.set(debater);
    this.showCreateForm.set(true);
  }

  closeForm() {
    this.showCreateForm.set(false);
    this.editingDebater.set(null);
    this.resetForm();
  }

  resetForm() {
    this.formData.set({
      name: '',
      description: '',
      model: 'llama3.2:latest',
      systemPrompt: '',
      isActive: true
    });
    this.formErrors.set([]);
  }

  validateForm(): boolean {
    const data = this.formData();
    return !!(data.name?.trim() && 
              data.description?.trim() && 
              data.model?.trim() && 
              data.systemPrompt?.trim());
  }

  get isFormValid(): boolean {
    return this.validateForm();
  }

  async saveDebater() {
    if (!this.validateForm()) return;
    
    this.loading.set(true);
    const data = { ...this.formData(), isActive: true } as CreateDebaterRequest;
    
    try {
      const editingDebater = this.editingDebater();
      
      if (editingDebater) {
        // Update existing debater
        const updates: UpdateDebaterRequest = {
          name: data.name,
          description: data.description,
          model: data.model,
          systemPrompt: data.systemPrompt,
          isActive: true
        };
        await this.debaterService.updateDebater(editingDebater.id, updates);
      } else {
        // Create new debater
        await this.debaterService.createDebater(data);
      }
      
      await this.loadDebaters();
      this.debaterUpdated.emit();
      this.closeForm();
    } catch (error) {
      console.error('Failed to save debater:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteDebater(debater: Debater) {
    if (debater.id === 'default') {
      alert('Cannot delete the default debater');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${debater.name}"?`)) {
      return;
    }
    
    try {
      await this.debaterService.deleteDebater(debater.id);
      await this.loadDebaters();
      this.debaterUpdated.emit();
    } catch (error) {
      console.error('Failed to delete debater:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete debater';
      alert(errorMessage);
    }
  }

  async toggleDebaterActive(debater: Debater) {
    if (debater.id === 'default' && debater.isActive) {
      alert('Cannot deactivate the default debater');
      return;
    }
    
    try {
      const updates: UpdateDebaterRequest = {
        isActive: !debater.isActive
      };
      await this.debaterService.updateDebater(debater.id, updates);
      await this.loadDebaters();
      this.debaterUpdated.emit();
    } catch (error) {
      console.error('Failed to toggle debater status:', error);
    }
  }

  updateFormField(field: keyof CreateDebaterRequest, value: any) {
    this.formData.update(current => ({
      ...current,
      [field]: value
    }));
  }

  get isEditing(): boolean {
    return this.editingDebater() !== null;
  }
}