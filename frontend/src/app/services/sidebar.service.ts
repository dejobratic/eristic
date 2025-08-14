import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isCollapsed = signal(true); // Start collapsed on mobile

  getIsCollapsed() {
    return this.isCollapsed.asReadonly();
  }

  toggleSidebar() {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.isCollapsed.set(collapsed);
  }
}