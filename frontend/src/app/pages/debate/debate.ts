import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DebateService } from '@eristic/app/services/debate.service';
import { DebaterService } from '@eristic/app/services/debater.service';
import { Debate as DebateType, DebateRound, DebateResponse, DebateParticipant } from '@eristic/app/types/debate.types';
import { Debater } from '@eristic/app/services/debater.service';

@Component({
  selector: 'app-debate',
  imports: [CommonModule, FormsModule],
  templateUrl: './debate.html',
  styleUrl: './debate.css'
})
export class DebatePage implements OnInit, OnDestroy {
  debate = signal<DebateType | null>(null);
  currentRound = signal<DebateRound | null>(null);
  rounds = signal<DebateRound[]>([]);
  responses = signal<DebateResponse[]>([]);
  participants = signal<DebateParticipant[]>([]);
  
  isGeneratingResponse = signal<boolean>(false);
  isLoadingDebate = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Enhanced loading states
  participantLoadingStates = signal<Map<string, boolean>>(new Map());
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private debateService = inject(DebateService);
  private debaterService = inject(DebaterService);

  // Route parameter tracking
  debateId = signal<string>('');
  private routeSubscription?: Subscription;
  
  currentParticipant = computed(() => {
    const round = this.currentRound();
    const participants = this.participants();
    const responses = this.responses();
    
    if (!round || !participants.length) return null;
    
    // Get current round responses
    const currentRoundResponses = responses.filter(r => r.roundId === round.id);
    const nextResponseOrder = currentRoundResponses.length + 1;
    
    // Find debater participants only
    const debaters = participants.filter(p => p.role === 'debater');
    
    // Find the participant whose turn it is based on response order
    return debaters.find(p => p.position === nextResponseOrder) || null;
  });

  nextParticipant = computed(() => {
    const round = this.currentRound();
    const participants = this.participants();
    const responses = this.responses();
    
    if (!round || !participants.length) return null;
    
    // Get current round responses
    const currentRoundResponses = responses.filter(r => r.roundId === round.id);
    const nextResponseOrder = currentRoundResponses.length + 2; // Next after current
    
    // Find debater participants only
    const debaters = participants.filter(p => p.role === 'debater');
    
    // Find the next participant
    return debaters.find(p => p.position === nextResponseOrder) || null;
  });

  canGenerateResponse = computed(() => {
    const debate = this.debate();
    return debate?.status === 'active' && !this.isGeneratingResponse() && this.currentParticipant();
  });

  canStartDebate = computed(() => {
    const debate = this.debate();
    return debate?.status === 'pending';
  });

  canPauseDebate = computed(() => {
    const debate = this.debate();
    return debate?.status === 'active';
  });

  canResumeDebate = computed(() => {
    const debate = this.debate();
    return debate?.status === 'paused';
  });

  isDebateComplete = computed(() => {
    const debate = this.debate();
    return debate?.status === 'completed';
  });

  progressPercentage = computed(() => {
    const debate = this.debate();
    if (!debate) return 0;
    
    const currentRound = debate.currentRound;
    const totalRounds = debate.totalRounds;
    
    return Math.round((currentRound / totalRounds) * 100);
  });

  async ngOnInit() {
    // Subscribe to route parameter changes
    this.routeSubscription = this.route.paramMap.subscribe(async (params) => {
      const debateId = params.get('debateId') || '';
      
      if (!debateId) {
        this.router.navigate(['/']);
        return;
      }

      this.debateId.set(debateId);
      await this.loadDebate(debateId);
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  async loadDebate(debateId: string) {
    try {
      this.isLoadingDebate.set(true);
      this.error.set(null);

      const debate = await this.debateService.getDebate(debateId);
      this.debate.set(debate);

      // Load related data
      await Promise.all([
        this.loadRounds(debateId),
        this.loadParticipants(debateId),
        this.loadResponses(debateId)
      ]);

      // Set current round
      if (debate && debate.currentRound > 0) {
        const rounds = this.rounds();
        const currentRound = rounds.find(r => r.roundNumber === debate.currentRound);
        this.currentRound.set(currentRound || null);
      }

    } catch (error) {
      console.error('Failed to load debate:', error);
      this.error.set('Failed to load debate. Please try again.');
    } finally {
      this.isLoadingDebate.set(false);
    }
  }

  async loadRounds(debateId: string) {
    try {
      const rounds = await this.debateService.getDebateRounds(debateId);
      this.rounds.set(rounds);
    } catch (error) {
      console.error('Failed to load rounds:', error);
    }
  }

  async loadParticipants(debateId: string) {
    try {
      const participants = await this.debateService.getDebateParticipants(debateId);
      this.participants.set(participants);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  }

  async loadResponses(debateId: string) {
    try {
      const responses = await this.debateService.getDebateResponses(debateId);
      this.responses.set(responses);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  }

  async startDebate() {
    const debateId = this.debateId();
    if (!debateId) return;

    try {
      await this.debateService.startDebate(debateId);
      await this.loadDebate(debateId);
    } catch (error) {
      console.error('Failed to start debate:', error);
      this.error.set('Failed to start debate. Please try again.');
    }
  }

  async pauseDebate() {
    const debateId = this.debateId();
    if (!debateId) return;

    try {
      await this.debateService.pauseDebate(debateId);
      await this.loadDebate(debateId);
    } catch (error) {
      console.error('Failed to pause debate:', error);
      this.error.set('Failed to pause debate. Please try again.');
    }
  }

  async resumeDebate() {
    const debateId = this.debateId();
    if (!debateId) return;

    try {
      await this.debateService.resumeDebate(debateId);
      await this.loadDebate(debateId);
    } catch (error) {
      console.error('Failed to resume debate:', error);
      this.error.set('Failed to resume debate. Please try again.');
    }
  }

  async generateResponse() {
    const debateId = this.debateId();
    const participant = this.currentParticipant();
    
    if (!debateId || !participant) return;

    try {
      this.isGeneratingResponse.set(true);
      this.setParticipantLoading(participant.debaterId, true);
      this.error.set(null);

      await this.debateService.generateParticipantResponse(debateId, participant.debaterId);
      
      // Reload debate data to get the latest response
      await this.loadDebate(debateId);

    } catch (error) {
      console.error('Failed to generate response:', error);
      this.error.set(`Failed to generate response for ${this.getDebaterName(participant.debaterId)}. Please try again.`);
    } finally {
      this.isGeneratingResponse.set(false);
      this.setParticipantLoading(participant.debaterId, false);
    }
  }

  async skipParticipant() {
    const debateId = this.debateId();
    if (!debateId) return;

    try {
      await this.debateService.skipCurrentParticipant(debateId);
      await this.loadDebate(debateId);
    } catch (error) {
      console.error('Failed to skip participant:', error);
      this.error.set('Failed to skip participant. Please try again.');
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  getDebaterName(debaterId: string): string {
    if (!debaterId || debaterId === 'default') return 'Default Assistant';
    const debater = this.debaterService.getDebatersSync().find(d => d.id === debaterId);
    return debater?.name || 'Unknown Debater';
  }

  getDebaterInfo(debaterId: string): Debater | null {
    if (!debaterId || debaterId === 'default') return null;
    return this.debaterService.getDebatersSync().find(d => d.id === debaterId) || null;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ready to Start';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'icon-pending';
      case 'active': return 'icon-active';
      case 'completed': return 'icon-completed';
      case 'paused': return 'icon-paused';
      default: return 'icon-unknown';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatResponseDate(response: DebateResponse): string {
    return this.formatDate(response.timestamp);
  }

  // Get responses for current round
  getCurrentRoundResponses(): DebateResponse[] {
    const currentRound = this.currentRound();
    if (!currentRound) return [];
    
    return this.responses().filter(r => r.roundId === currentRound.id);
  }

  // Get responses for a specific round
  getRoundResponses(roundId: string): DebateResponse[] {
    return this.responses().filter(r => r.roundId === roundId);
  }

  // Get completed rounds
  getCompletedRounds(): DebateRound[] {
    return this.rounds().filter(r => r.status === 'completed');
  }

  // Participant loading state management
  setParticipantLoading(debaterId: string, loading: boolean) {
    const currentStates = new Map(this.participantLoadingStates());
    if (loading) {
      currentStates.set(debaterId, true);
    } else {
      currentStates.delete(debaterId);
    }
    this.participantLoadingStates.set(currentStates);
  }

  isParticipantLoading(debaterId: string): boolean {
    return this.participantLoadingStates().get(debaterId) || false;
  }

  // Enhanced computed properties
  isCurrentParticipantLoading = computed(() => {
    const current = this.currentParticipant();
    return current ? this.isParticipantLoading(current.debaterId) : false;
  });

}