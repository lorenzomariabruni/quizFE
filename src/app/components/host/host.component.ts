import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';

interface Player {
  name: string;
}

interface Question {
  question_number: number;
  total_questions: number;
  question: string;
  answers: string[];
  time_limit: number;
}

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit, OnDestroy {
  sessionId = 'QUIZ' + Math.random().toString(36).substring(2, 6).toUpperCase();
  players: Player[] = [];
  gameState: 'waiting' | 'playing' | 'finished' = 'waiting';
  currentQuestion: Question | null = null;
  timeRemaining = 0;
  leaderboard: any[] = [];
  correctAnswer = -1;
  qrCodeUrl = '';
  joinUrl = '';
  networkIp = '';

  // Expose to template
  String = String;

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Create session
    this.socketService.createSession(this.sessionId);

    // Get network IP
    await this.detectNetworkIp();

    // Generate QR Code with network IP
    const port = window.location.port ? `:${window.location.port}` : '';
    this.joinUrl = `http://${this.networkIp}${port}/play/${this.sessionId}`;
    
    this.qrCodeUrl = await QRCode.toDataURL(this.joinUrl, { width: 300 });

    // Listen to events
    this.subscriptions.push(
      this.socketService.on<any>('session_created').subscribe(data => {
        console.log('Session created:', data);
      }),

      this.socketService.on<any>('player_joined').subscribe(data => {
        this.players.push({ name: data.player_name });
      }),

      this.socketService.on<any>('game_started').subscribe(() => {
        this.gameState = 'playing';
      }),

      this.socketService.on<Question>('new_question').subscribe(question => {
        this.currentQuestion = question;
        this.timeRemaining = question.time_limit;
        this.correctAnswer = -1;
      }),

      this.socketService.on<any>('timer_update').subscribe(data => {
        this.timeRemaining = data.remaining;
      }),

      this.socketService.on<any>('question_results').subscribe(data => {
        this.correctAnswer = data.correct_answer;
        this.leaderboard = data.leaderboard;
      }),

      this.socketService.on<any>('game_over').subscribe(data => {
        this.gameState = 'finished';
        this.leaderboard = data.leaderboard;
      })
    );
  }

  private async detectNetworkIp(): Promise<void> {
    // Try to detect network IP using WebRTC
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          pc.close();
          resolve();
          return;
        }
        
        const ipRegex = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/;
        const ipMatch = ipRegex.exec(ice.candidate.candidate);
        
        if (ipMatch && ipMatch[1]) {
          const detectedIp = ipMatch[1];
          // Skip localhost and 0.0.0.0
          if (detectedIp !== '127.0.0.1' && detectedIp !== '0.0.0.0') {
            this.networkIp = detectedIp;
            pc.close();
            resolve();
          }
        }
      };
      
      // Fallback dopo 2 secondi
      setTimeout(() => {
        if (!this.networkIp) {
          // Usa l'hostname come fallback
          this.networkIp = window.location.hostname;
          if (this.networkIp === 'localhost' || this.networkIp === '127.0.0.1') {
            this.networkIp = 'localhost';
            console.warn('Non riesco a rilevare l\'IP di rete. Assicurati di avviare con: ng serve --host 0.0.0.0');
          }
        }
        pc.close();
        resolve();
      }, 2000);
    });
  }

  startGame(): void {
    if (this.players.length > 0) {
      this.socketService.startGame(this.sessionId);
    } else {
      alert('Aspetta che almeno un giocatore si unisca!');
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}