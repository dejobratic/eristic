import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DebaterService, Debater } from '@eristic/app/services/debater.service';
import { DebateService } from '@eristic/app/services/debate.service';
import { SettingsService } from '@eristic/app/services/settings.service';
import { DebateSettings, CreateDebateRequest } from '@eristic/app/types/debate.types';

@Component({
  selector: 'app-debate-setup',
  imports: [CommonModule, FormsModule],
  templateUrl: './debate-setup.html',
  styleUrl: './debate-setup.css'
})
export class DebateSetup implements OnInit {
  topic = '';
  selectedParticipants = signal<string[]>([]);
  selectedModerator = signal<string>('default');
  debateSettings = signal<DebateSettings>({
    numDebaters: 2,
    numRounds: 3,
    turnOrder: 'fixed',
    responseTimeout: 5,
    maxResponseLength: 2000
  });
  isCreating = signal<boolean>(false);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private debaterService = inject(DebaterService);
  private debateService = inject(DebateService);
  private settingsService = inject(SettingsService);

  // Get active debaters for selection
  get activeDebaters(): Debater[] {
    return this.debaterService.getDebatersSync().filter(d => d.isActive);
  }

  // Get available moderators (all active debaters)
  get availableModerators(): Debater[] {
    return this.activeDebaters;
  }

  ngOnInit() {
    // Get topic from route
    this.topic = this.route.snapshot.paramMap.get('topic') || '';
    
    // Get any pre-selected debater from navigation state
    const navigation = this.router.getCurrentNavigation();
    const selectedDebaterId = navigation?.extras?.state?.['selectedDebaterId'];
    
    // Load user's default settings
    this.loadUserSettings();
    
    // Initialize with pre-selected debater if available
    if (selectedDebaterId && selectedDebaterId !== 'default') {
      this.selectedParticipants.set([selectedDebaterId]);
    }
  }

  async loadUserSettings() {
    try {
      const settings = await this.settingsService.getDebateSettings();
      this.debateSettings.set(settings);
      
      // Initialize participant array with correct size
      const currentParticipants = this.selectedParticipants();
      if (currentParticipants.length < settings.numDebaters) {
        // Fill remaining slots with empty strings
        const filled = [...currentParticipants];
        while (filled.length < settings.numDebaters) {
          filled.push('');
        }
        this.selectedParticipants.set(filled);
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  }

  onNumDebatersChange(newNum: number) {
    const settings = this.debateSettings();
    this.debateSettings.set({ ...settings, numDebaters: newNum });
    
    // Adjust participant array size
    const currentParticipants = this.selectedParticipants();
    if (currentParticipants.length > newNum) {
      // Remove excess participants
      this.selectedParticipants.set(currentParticipants.slice(0, newNum));
    } else if (currentParticipants.length < newNum) {
      // Add empty slots
      const filled = [...currentParticipants];
      while (filled.length < newNum) {
        filled.push('');
      }
      this.selectedParticipants.set(filled);
    }
  }

  onNumRoundsChange(newNum: number) {
    const settings = this.debateSettings();
    this.debateSettings.set({ ...settings, numRounds: newNum });
  }

  onTurnOrderChange(newOrder: string) {
    const settings = this.debateSettings();
    this.debateSettings.set({ ...settings, turnOrder: newOrder as any });
  }

  onTimeoutChange(newTimeout: number) {
    const settings = this.debateSettings();
    this.debateSettings.set({ ...settings, responseTimeout: newTimeout });
  }

  onMaxLengthChange(newLength: number) {
    const settings = this.debateSettings();
    this.debateSettings.set({ ...settings, maxResponseLength: newLength });
  }

  onParticipantChange(index: number, debaterId: string) {
    const participants = [...this.selectedParticipants()];
    participants[index] = debaterId;
    this.selectedParticipants.set(participants);
  }

  onModeratorChange(debaterId: string) {
    this.selectedModerator.set(debaterId);
  }

  isParticipantValid(): boolean {
    const participants = this.selectedParticipants();
    const validParticipants = participants.filter(p => p && p.trim() !== '');
    
    // Check if we have the required number of participants
    if (validParticipants.length !== this.debateSettings().numDebaters) {
      return false;
    }
    
    // Check for duplicates
    const uniqueParticipants = new Set(validParticipants);
    if (uniqueParticipants.size !== validParticipants.length) {
      return false;
    }
    
    // Check if moderator is different from participants
    const moderator = this.selectedModerator();
    if (moderator && moderator !== 'default' && validParticipants.includes(moderator)) {
      return false;
    }
    
    return true;
  }

  get validParticipants() {
    return this.selectedParticipants().filter(p => p && p.trim() !== '');
  }

  get hasCorrectNumberOfParticipants() {
    return this.validParticipants.length === this.debateSettings().numDebaters;
  }

  get hasDuplicateParticipants() {
    const validParticipants = this.validParticipants;
    return new Set(validParticipants).size !== validParticipants.length;
  }

  get moderatorIsParticipant() {
    const moderator = this.selectedModerator();
    return moderator !== 'default' && this.validParticipants.includes(moderator);
  }

  canCreateDebate(): boolean {
    return (
      this.topic.trim() !== '' &&
      this.isParticipantValid() &&
      this.selectedModerator() !== '' &&
      !this.isCreating()
    );
  }

  async createDebate() {
    if (!this.canCreateDebate()) return;
    
    this.isCreating.set(true);
    
    try {
      const participants = this.selectedParticipants().filter(p => p && p.trim() !== '');
      const moderator = this.selectedModerator();
      
      const request: CreateDebateRequest = {
        topic: this.topic.trim(),
        participantIds: participants,
        moderatorId: moderator === 'default' ? 'default' : moderator,
        settings: this.debateSettings()
      };
      
      const debate = await this.debateService.createDebate(request);
      
      // Navigate to the debate page
      this.router.navigate(['/debate', debate.id]);
      
    } catch (error) {
      console.error('Failed to create debate:', error);
      // TODO: Show error message to user
    } finally {
      this.isCreating.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  getDebaterName(debaterId: string): string {
    if (!debaterId || debaterId === 'default') return 'Default Assistant';
    const debater = this.activeDebaters.find(d => d.id === debaterId);
    return debater?.name || 'Unknown Debater';
  }

  isDebaterDisabled(debaterId: string): boolean {
    const participants = this.selectedParticipants();
    const moderator = this.selectedModerator();
    
    // Disable if already selected as participant
    if (participants.includes(debaterId)) return true;
    
    // Disable if selected as moderator
    if (moderator === debaterId) return true;
    
    return false;
  }
}