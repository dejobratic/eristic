import { Component, inject } from '@angular/core';

import { MobileNavService } from '@eristic/app/services/mobile-nav';

@Component({
  selector: 'app-mobile-menu-button',
  imports: [],
  templateUrl: './mobile-menu-button.html',
  styleUrl: './mobile-menu-button.css'
})
export class MobileMenuButton {
  private mobileNavService = inject(MobileNavService);
  
  isMobile = this.mobileNavService.getIsMobile();
  
  openMobileNav() {
    this.mobileNavService.open();
  }
}