import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'eristic-theme';
  private theme = signal<Theme>('light');

  constructor() {
    this.loadTheme();
    
    // Apply theme changes to document
    effect(() => {
      this.applyTheme(this.theme());
    });
  }

  getTheme() {
    return this.theme.asReadonly();
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    this.saveTheme(theme);
  }

  toggleTheme() {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  isDark() {
    return this.theme() === 'dark';
  }

  isLight() {
    return this.theme() === 'light';
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.theme.set(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }
  }

  private saveTheme(theme: Theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
      metaThemeColor.setAttribute('content', backgroundColor);
    }
  }
}