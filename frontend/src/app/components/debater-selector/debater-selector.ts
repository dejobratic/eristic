import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DebaterService, Debater } from '@eristic/app/services/debater.service';

@Component({
  selector: 'app-debater-selector',
  imports: [CommonModule],
  templateUrl: './debater-selector.html',
  styleUrl: './debater-selector.css'
})
export class DebaterSelector {
  // Input properties
  selectedDebaterId = input<string | null>(null);
  disabled = input<boolean>(false);
  
  // Output events
  debaterChanged = output<string | null>();

  private debaterService = inject(DebaterService);
  
  activeDebaters = signal<Debater[]>([]);
  loadingDebaters = signal<boolean>(false);

  constructor() {
    this.loadActiveDebaters();
  }

  async loadActiveDebaters() {
    this.loadingDebaters.set(true);
    try {
      const debaters = await this.debaterService.getActiveDebaters();
      this.activeDebaters.set(debaters);
    } catch (error) {
      console.error('Failed to load active debaters:', error);
    } finally {
      this.loadingDebaters.set(false);
    }
  }

  onDebaterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const debaterId = select.value || null;
    this.debaterChanged.emit(debaterId);
  }

  get selectedDebater(): Debater | null {
    const debaterId = this.selectedDebaterId();
    if (!debaterId) return null;
    
    return this.activeDebaters().find(d => d.id === debaterId) || null;
  }
}