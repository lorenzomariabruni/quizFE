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

    // Get network IP and generate QR Code
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    this.joinUrl = `http://${host}${port}/play/${this.sessionId}`;
    
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