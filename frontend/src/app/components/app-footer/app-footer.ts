import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.css'
})
export class AppFooter {
  currentYear = new Date().getFullYear();
  version = '1.0.0';
  
  getAngularVersion(): string {
    return '18+';
  }
  
  openGitHub() {
    window.open('https://github.com/dejobratic/eristic', '_blank');
  }
  
}