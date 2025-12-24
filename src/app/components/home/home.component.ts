import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card" style="margin-top: 100px; text-align: center;">
        <h1 style="font-size: 48px; margin-bottom: 20px; color: #667eea;">🎯 Quiz Real-Time</h1>
        <p style="font-size: 20px; margin-bottom: 40px; color: #666;">Gioca in tempo reale con i tuoi amici!</p>
        
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" (click)="goToHost()" style="font-size: 20px; padding: 20px 40px;">
            🎮 Crea Sessione (Host)
          </button>
          
          <button class="btn btn-success" (click)="goToJoin()" style="font-size: 20px; padding: 20px 40px;">
            📱 Unisciti al Gioco
          </button>
        </div>

        <div style="margin-top: 60px; padding: 20px; background: #f7fafc; border-radius: 8px;">
          <h3 style="margin-bottom: 15px;">Come funziona:</h3>
          <ol style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 2;">
            <li>L'host crea una sessione di gioco</li>
            <li>I giocatori scansionano il QR code o inseriscono il codice</li>
            <li>L'host avvia il quiz</li>
            <li>Rispondi velocemente per ottenere più punti!</li>
            <li>Il giocatore più veloce e preciso vince</li>
          </ol>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToHost(): void {
    this.router.navigate(['/host']);
  }

  goToJoin(): void {
    const sessionId = prompt('Inserisci il codice della sessione:');
    if (sessionId) {
      this.router.navigate(['/play', sessionId]);
    }
  }
}