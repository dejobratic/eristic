import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { signal } from '@angular/core';

import { AppHeader } from '@eristic/app/components/app-header/app-header';
import { Sidebar } from '@eristic/app/components/sidebar/sidebar';
import { AppFooter } from '@eristic/app/components/app-footer/app-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, Sidebar, AppFooter],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  
  isHomePage = signal(true);
  
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url)
    ).subscribe(url => {
      this.isHomePage.set(url === '/');
    });
  }
}
