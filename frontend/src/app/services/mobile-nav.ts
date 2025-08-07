import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileNavService {
  private isOpen = signal(false);
  private isMobile = signal(false);

  constructor() {
    this.checkIsMobile();
    this.setupResizeListener();
    
    // Auto-close nav when switching to desktop
    effect(() => {
      if (!this.isMobile() && this.isOpen()) {
        this.close();
      }
    });
  }

  getIsOpen() {
    return this.isOpen.asReadonly();
  }

  getIsMobile() {
    return this.isMobile.asReadonly();
  }

  open() {
    this.isOpen.set(true);
    // Prevent body scrolling when mobile nav is open
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen.set(false);
    // Re-enable body scrolling
    document.body.style.overflow = '';
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  private checkIsMobile() {
    this.isMobile.set(window.innerWidth < 768);
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.checkIsMobile();
    });
  }
}