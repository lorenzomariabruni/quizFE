import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  sessionCode = '';

  constructor(private router: Router) {}

  joinSession(): void {
    if (this.sessionCode.trim()) {
      this.router.navigate(['/play', this.sessionCode.toUpperCase()]);
    }
  }
}