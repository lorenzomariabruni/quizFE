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
    this.networkIp = await this.getLocalIpAddress();
    console.log('Detected IP:', this.networkIp);

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

  private async getLocalIpAddress(): Promise<string> {
    try {
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: []
      });

      // Create a dummy data channel
      pc.createDataChannel('');

      // Create offer and set as local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE candidate
      return new Promise<string>((resolve) => {
        let resolved = false;

        pc.onicecandidate = (event) => {
          if (resolved) return;

          if (event.candidate) {
            const candidate = event.candidate.candidate;
            console.log('ICE Candidate:', candidate);

            // Extract IP from candidate string
            // Format: "candidate:... typ host" contains the local IP
            const ipRegex = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/;
            const match = candidate.match(ipRegex);

            if (match && match[1]) {
              const ip = match[1];
              // Skip loopback and invalid IPs
              if (ip !== '0.0.0.0' && !ip.startsWith('127.')) {
                console.log('Found valid IP:', ip);
                resolved = true;
                this.networkIp = ip;
                pc.close();
                resolve(ip);
              }
            }
          }
        };

        // Fallback timeout
        setTimeout(() => {
          if (!resolved) {
            console.warn('Could not detect IP via WebRTC, using hostname');
            pc.close();
            const hostname = window.location.hostname;
            resolve(hostname === 'localhost' ? this.promptForIp() : hostname);
          }
        }, 3000);
      });
    } catch (error) {
      console.error('Error detecting IP:', error);
      const hostname = window.location.hostname;
      return hostname === 'localhost' ? this.promptForIp() : hostname;
    }
  }

  private promptForIp(): string {
    const manualIp = prompt(
      'Non riesco a rilevare automaticamente l\'IP.\n\n' +
      'Inserisci manualmente l\'IP di questa macchina sulla rete locale\n' +
      '(es. 192.168.1.100):\n\n' +
      'Puoi trovarlo con:\n' +
      '- Mac/Linux: ifconfig | grep "inet "\n' +
      '- Windows: ipconfig'
    );
    return manualIp && manualIp.trim() ? manualIp.trim() : 'localhost';
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