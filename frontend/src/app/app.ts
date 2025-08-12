import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '@eristic/app/components/app-header/app-header';
import { Sidebar } from '@eristic/app/components/sidebar/sidebar';
import { AppFooter } from '@eristic/app/components/app-footer/app-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, Sidebar, AppFooter],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
