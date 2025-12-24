import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

interface Question {
  question_number: number;
  total_questions: number;
  question: string;
  answers: string[];
  time_limit: number;
  already_answered?: boolean;
}

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, OnDestroy {
  sessionId = '';
  playerName = '';
  joined = false;
  gameState: 'waiting' | 'playing' | 'finished' = 'waiting';
  currentQuestion: Question | null = null;
  selectedAnswer = -1;
  answered = false;
  timeRemaining = 0;
  lastResult: { points_earned: number; is_correct: boolean } | null = null;
  finalLeaderboard: any[] = [];
  isReconnected = false;
  connectionStatus = true;

  // Expose to template
  String = String;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    // Check for existing session in localStorage
    const storedSession = this.socketService.getSessionInfo();
    if (storedSession && storedSession.sessionId === this.sessionId) {
      this.playerName = storedSession.playerName;
      this.joined = true;
      console.log('Recovering session for:', this.playerName);
    }

    // Monitor connection status
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        this.connectionStatus = connected;
        console.log('Connection status:', connected);
      })
    );

    // Listen to events
    this.subscriptions.push(
      this.socketService.on<any>('joined_session').subscribe((data) => {
        this.joined = true;
        this.isReconnected = data.reconnected || false;
        
        if (this.isReconnected) {
          console.log('Reconnected! Game state:', data.game_state);
          this.gameState = data.game_state || 'waiting';
          
          // Show reconnection message
          if (data.game_state === 'playing') {
            alert(`Bentornato ${this.playerName}! Sei stato riconnesso al quiz in corso.`);
          }
        }
      }),

      this.socketService.on<any>('error').subscribe(data => {
        console.error('Error from server:', data.message);
        if (!data.message.includes('Already answered')) {
          alert(data.message);
        }
      }),

      this.socketService.on<any>('game_started').subscribe(() => {
        this.gameState = 'playing';
      }),

      this.socketService.on<Question>('new_question').subscribe(question => {
        this.currentQuestion = question;
        this.selectedAnswer = -1;
        this.answered = question.already_answered || false;
        this.timeRemaining = question.time_limit;
        this.lastResult = null;
        
        if (this.answered) {
          console.log('Already answered this question');
        }
      }),

      this.socketService.on<any>('timer_update').subscribe(data => {
        this.timeRemaining = data.remaining;
      }),

      this.socketService.on<any>('answer_submitted').subscribe(data => {
        this.lastResult = data;
      }),

      this.socketService.on<any>('game_over').subscribe(data => {
        this.gameState = 'finished';
        this.finalLeaderboard = data.leaderboard;
        this.socketService.clearSessionInfo();
      })
    );
  }

  joinGame(): void {
    if (this.playerName.trim()) {
      this.socketService.joinSession(this.sessionId, this.playerName);
    }
  }

  selectAnswer(index: number): void {
    if (!this.answered && this.timeRemaining > 0) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer !== -1 && !this.answered) {
      this.socketService.submitAnswer(this.selectedAnswer);
      this.answered = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}