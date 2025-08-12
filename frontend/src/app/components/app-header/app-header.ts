import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ThemeService } from '@eristic/app/services/theme';
import { LLMService } from '@eristic/app/services/llm.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  private themeService = inject(ThemeService);
  private llmService = inject(LLMService);
  private router = inject(Router);
  
  currentTheme = this.themeService.getTheme();
  llmStatus = this.llmService.getStatusState();
  isMobileMenuOpen = signal(false);


  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }


  get isLLMOnline() {
    return this.llmStatus()?.available || false;
  }
}