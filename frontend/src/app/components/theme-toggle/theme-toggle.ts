import { Component, inject } from '@angular/core';

import { ThemeService } from '@eristic/app/services/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css'
})
export class ThemeToggle {
  private themeService = inject(ThemeService);

  currentTheme = this.themeService.getTheme();

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get isDark() {
    return this.currentTheme() === 'dark';
  }

  get isLight() {
    return this.currentTheme() === 'light';
  }
}