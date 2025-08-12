import { Injectable, inject, signal } from '@angular/core';

import { HttpService, HttpResponse } from '@eristic/app/services/http.service';
import { environment } from '@eristic/environments/environment';

export interface Debater {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDebaterRequest {
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
}

export interface UpdateDebaterRequest {
  name?: string;
  description?: string;
  model?: string;
  systemPrompt?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DebaterService {
  private readonly apiUrl = environment.backendUrl;
  private readonly httpService = inject(HttpService);
  
  private loadingState = signal<boolean>(false);
  private debaters = signal<Debater[]>([]);

  constructor() {
    this.loadDebaters();
  }

  async createDebater(debaterData: CreateDebaterRequest): Promise<Debater> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/debaters');
      const response = await this.httpService.post<HttpResponse<Debater>, CreateDebaterRequest>(
        url, 
        debaterData
      );
      
      const newDebater = this.httpService.extractApiData(response);
      
      // Process dates
      const processedDebater = {
        ...newDebater,
        createdAt: new Date(newDebater.createdAt),
        updatedAt: new Date(newDebater.updatedAt)
      };
      
      // Update local cache
      const currentDebaters = this.debaters();
      this.debaters.set([...currentDebaters, processedDebater]);
      
      return processedDebater;
    } catch (error) {
      console.error('Error creating debater:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async getDebater(id: string): Promise<Debater> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debaters/${id}`);
      const response = await this.httpService.get<HttpResponse<Debater>>(url);
      
      const debater = this.httpService.extractApiData(response);
      
      return {
        ...debater,
        createdAt: new Date(debater.createdAt),
        updatedAt: new Date(debater.updatedAt)
      };
    } catch (error) {
      console.error('Error getting debater:', error);
      throw error;
    }
  }

  async getAllDebaters(): Promise<Debater[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/debaters');
      const response = await this.httpService.get<HttpResponse<Debater[]>>(url);
      
      const debaters = this.httpService.extractApiData(response);
      
      // Process dates
      const processedDebaters = debaters.map(debater => ({
        ...debater,
        createdAt: new Date(debater.createdAt),
        updatedAt: new Date(debater.updatedAt)
      }));
      
      this.debaters.set(processedDebaters);
      return processedDebaters;
    } catch (error) {
      console.error('Error fetching debaters:', error);
      throw error;
    }
  }

  async getActiveDebaters(): Promise<Debater[]> {
    try {
      const url = this.httpService.buildUrl(this.apiUrl, '/api/debaters/active');
      const response = await this.httpService.get<HttpResponse<Debater[]>>(url);
      
      const debaters = this.httpService.extractApiData(response);
      
      return debaters.map(debater => ({
        ...debater,
        createdAt: new Date(debater.createdAt),
        updatedAt: new Date(debater.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching active debaters:', error);
      return [];
    }
  }

  async updateDebater(id: string, updates: UpdateDebaterRequest): Promise<Debater> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debaters/${id}`);
      const response = await this.httpService.put<HttpResponse<Debater>, UpdateDebaterRequest>(
        url, 
        updates
      );
      
      const updatedDebater = this.httpService.extractApiData(response);
      
      // Process dates
      const processedDebater = {
        ...updatedDebater,
        createdAt: new Date(updatedDebater.createdAt),
        updatedAt: new Date(updatedDebater.updatedAt)
      };
      
      // Update local cache
      const currentDebaters = this.debaters();
      const updatedList = currentDebaters.map(d => d.id === id ? processedDebater : d);
      this.debaters.set(updatedList);
      
      return processedDebater;
    } catch (error) {
      console.error('Error updating debater:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async deleteDebater(id: string): Promise<void> {
    this.loadingState.set(true);
    
    try {
      const url = this.httpService.buildUrl(this.apiUrl, `/api/debaters/${id}`);
      await this.httpService.delete<HttpResponse<any>>(url);
      
      // Update local cache
      const currentDebaters = this.debaters();
      const filteredList = currentDebaters.filter(d => d.id !== id);
      this.debaters.set(filteredList);
    } catch (error) {
      console.error('Error deleting debater:', error);
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async refreshDebaters(): Promise<void> {
    await this.loadDebaters();
  }

  private async loadDebaters(): Promise<void> {
    try {
      await this.getAllDebaters();
    } catch (error) {
      console.error('Failed to load debaters:', error);
      // Set empty array on error
      this.debaters.set([]);
    }
  }

  getLoadingState() {
    return this.loadingState.asReadonly();
  }

  getDebaters() {
    return this.debaters.asReadonly();
  }

  getDebatersSync(): Debater[] {
    return this.debaters();
  }
}