import { Injectable, signal, inject } from '@angular/core';

import { HttpService, HttpResponse } from '@eristic/app/services/http.service';
import { Debate, DebateWithDetails, CreateDebateRequest, DebateResponse, DebateRound, DebateParticipant } from '@eristic/app/types/debate.types';
import { environment } from '@eristic/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebateService {
  private httpService = inject(HttpService);
  private debates = signal<Debate[]>([]);
  private loadingState = signal<boolean>(false);
  private apiUrl = environment.backendUrl;

  constructor() {
    this.loadDebatesFromDatabase();
  }

  async createDebate(request: CreateDebateRequest): Promise<Debate> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/debates');
      const response = await this.httpService.post<HttpResponse<Debate>, CreateDebateRequest>(
        url, 
        request
      );
      
      const debate = this.httpService.extractApiData(response);
      
      // Process dates
      const processedDebate = {
        ...debate,
        createdAt: new Date(debate.createdAt),
        updatedAt: new Date(debate.updatedAt)
      };
      
      // Update local cache
      this.updateDebateCache(processedDebate);
      
      return processedDebate;
    } catch (error) {
      console.error('Failed to create debate:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async getDebate(debateId: string): Promise<DebateWithDetails | null> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}`);
      const response = await this.httpService.get<HttpResponse<DebateWithDetails>>(url);
      const debate = this.httpService.extractApiData(response);
      
      // Process dates
      return this.processDebateWithDetails(debate);
    } catch (error) {
      console.error('Failed to get debate:', error);
      return null;
    }
  }

  async startDebate(debateId: string): Promise<void> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/start`);
      await this.httpService.post<HttpResponse<any>, {}>(url, {});
      
      // Update local cache
      await this.refreshDebates();
    } catch (error) {
      console.error('Failed to start debate:', error);
      throw error;
    }
  }

  async processNextResponse(debateId: string): Promise<DebateResponse | null> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/next`);
      const response = await this.httpService.post<HttpResponse<DebateResponse>, {}>(url, {});
      
      const debateResponse = this.httpService.extractApiData(response);
      if (!debateResponse) return null;
      
      // Process dates
      return {
        ...debateResponse,
        timestamp: new Date(debateResponse.timestamp)
      };
    } catch (error) {
      console.error('Failed to process next response:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async pauseDebate(debateId: string): Promise<void> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/pause`);
      await this.httpService.post<HttpResponse<any>, {}>(url, {});
      
      // Update local cache
      await this.refreshDebates();
    } catch (error) {
      console.error('Failed to pause debate:', error);
      throw error;
    }
  }

  async resumeDebate(debateId: string): Promise<void> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/resume`);
      await this.httpService.post<HttpResponse<any>, {}>(url, {});
      
      // Update local cache
      await this.refreshDebates();
    } catch (error) {
      console.error('Failed to resume debate:', error);
      throw error;
    }
  }

  async deleteDebate(debateId: string): Promise<void> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}`);
      await this.httpService.delete<HttpResponse<any>>(url);
      
      // Update local state
      const currentDebates = this.debates();
      const filteredDebates = currentDebates.filter(debate => debate.id !== debateId);
      this.debates.set(filteredDebates);
    } catch (error) {
      console.error('Failed to delete debate:', error);
      throw error;
    }
  }

  async generateRoundSummary(debateId: string, roundNumber: number): Promise<string> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/summary/round/${roundNumber}`);
      const response = await this.httpService.get<HttpResponse<{ summary: string }>>(url);
      const data = this.httpService.extractApiData(response);
      return data.summary;
    } catch (error) {
      console.error('Failed to generate round summary:', error);
      throw error;
    }
  }

  async generateFinalSummary(debateId: string): Promise<string> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/summary/final`);
      const response = await this.httpService.get<HttpResponse<{ summary: string }>>(url);
      const data = this.httpService.extractApiData(response);
      return data.summary;
    } catch (error) {
      console.error('Failed to generate final summary:', error);
      throw error;
    }
  }

  async getDebateRounds(debateId: string): Promise<DebateRound[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/rounds`);
      const response = await this.httpService.get<HttpResponse<DebateRound[]>>(url);
      const rounds = this.httpService.extractApiData(response);
      
      // Process dates
      return rounds.map(round => ({
        ...round,
        createdAt: new Date(round.createdAt),
        updatedAt: new Date(round.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to get debate rounds:', error);
      return [];
    }
  }

  async getDebateParticipants(debateId: string): Promise<DebateParticipant[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/participants`);
      const response = await this.httpService.get<HttpResponse<DebateParticipant[]>>(url);
      const participants = this.httpService.extractApiData(response);
      return participants;
    } catch (error) {
      console.error('Failed to get debate participants:', error);
      return [];
    }
  }

  async getDebateResponses(debateId: string): Promise<DebateResponse[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/responses`);
      const response = await this.httpService.get<HttpResponse<DebateResponse[]>>(url);
      const responses = this.httpService.extractApiData(response);
      
      // Process dates
      return responses.map(response => ({
        ...response,
        timestamp: new Date(response.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get debate responses:', error);
      return [];
    }
  }

  async generateParticipantResponse(debateId: string, participantId: string): Promise<DebateResponse> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/generate-response`);
      const response = await this.httpService.post<HttpResponse<DebateResponse>, { participantId: string }>(
        url, 
        { participantId }
      );
      
      const debateResponse = this.httpService.extractApiData(response);
      
      // Process dates
      return {
        ...debateResponse,
        timestamp: new Date(debateResponse.timestamp)
      };
    } catch (error) {
      console.error('Failed to generate participant response:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async skipCurrentParticipant(debateId: string): Promise<void> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debates/${debateId}/skip`);
      await this.httpService.post<HttpResponse<any>, {}>(url, {});
      
      // Update local cache
      await this.refreshDebates();
    } catch (error) {
      console.error('Failed to skip current participant:', error);
      throw error;
    }
  }

  getDebates() {
    return this.debates.asReadonly();
  }

  getLoadingState() {
    return this.loadingState.asReadonly();
  }

  async refreshDebates() {
    await this.loadDebatesFromDatabase();
  }

  getDebatesSync(): Debate[] {
    return this.debates();
  }

  private async loadDebatesFromDatabase() {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/debates');
      const response = await this.httpService.get<HttpResponse<Debate[]>>(url);
      const debates = this.httpService.extractApiData(response);
      
      // Convert date strings to Date objects
      const processedDebates = debates.map(debate => ({
        ...debate,
        createdAt: new Date(debate.createdAt),
        updatedAt: new Date(debate.updatedAt)
      }));
      
      this.debates.set(processedDebates);
    } catch (error) {
      console.error('Failed to load debates from database:', error);
      // Set empty array if load fails
      this.debates.set([]);
    }
  }

  private updateDebateCache(debate: Debate) {
    const currentDebates = this.debates();
    const existingIndex = currentDebates.findIndex(d => d.id === debate.id);
    
    if (existingIndex >= 0) {
      // Update existing debate
      currentDebates[existingIndex] = debate;
    } else {
      // Add new debate to the beginning of the list
      currentDebates.unshift(debate);
    }
    
    this.debates.set([...currentDebates]);
  }

  private processDebateWithDetails(debate: DebateWithDetails): DebateWithDetails {
    return {
      ...debate,
      createdAt: new Date(debate.createdAt),
      updatedAt: new Date(debate.updatedAt),
      rounds: debate.rounds.map(round => ({
        ...round,
        createdAt: new Date(round.createdAt),
        updatedAt: new Date(round.updatedAt)
      })),
      currentRoundResponses: debate.currentRoundResponses?.map(response => ({
        ...response,
        timestamp: new Date(response.timestamp)
      }))
    };
  }
}