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
  isJoining = false;
  reconnectionAttempts = 0;

  // Expose to template
  String = String;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    console.log('🎯 Player component initialized with session:', this.sessionId);

    // Check for existing session in localStorage
    const storedSession = this.socketService.getSessionInfo();
    if (storedSession && storedSession.sessionId === this.sessionId) {
      this.playerName = storedSession.playerName;
      this.joined = true; // Mark as joined since we're recovering
      console.log('♻️ Recovering previous session for:', this.playerName);
    }

    // Monitor connection status
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        const wasDisconnected = !this.connectionStatus;
        this.connectionStatus = connected;
        console.log('🔌 Connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');
        
        // Reset reconnection attempts on successful connection
        if (connected && wasDisconnected) {
          this.reconnectionAttempts = 0;
          console.log('✅ Connection restored!');
        } else if (!connected) {
          this.reconnectionAttempts++;
        }
      })
    );

    // Listen to events
    this.subscriptions.push(
      this.socketService.on<any>('joined_session').subscribe((data) => {
        console.log('✅ Joined session successfully:', data);
        this.joined = true;
        this.isJoining = false;
        this.isReconnected = data.reconnected || false;
        
        if (this.isReconnected) {
          console.log('♻️ Reconnected! Game state:', data.game_state);
          this.gameState = data.game_state || 'waiting';
        }
      }),

      this.socketService.on<any>('error').subscribe(data => {
        console.error('❌ Error from server:', data.message);
        this.isJoining = false;
        
        if (data.message === 'Session not found') {
          alert('Sessione non trovata! Verifica il codice.');
        } else if (data.message === 'Game already started' && !this.joined) {
          alert('Il gioco è già iniziato. Non puoi più unirti.');
        } else if (!data.message.includes('Already answered')) {
          // Don't show alert for other errors during reconnection
          console.warn('Server error (not showing to user):', data.message);
        }
      }),

      this.socketService.on<any>('game_started').subscribe(() => {
        console.log('🎮 Game started!');
        this.gameState = 'playing';
      }),

      this.socketService.on<Question>('new_question').subscribe(question => {
        console.log('❓ New question received:', question.question);
        this.currentQuestion = question;
        this.selectedAnswer = -1;
        this.answered = question.already_answered || false;
        this.timeRemaining = question.time_limit;
        this.lastResult = null;
        
        if (this.answered) {
          console.log('⏭️ Already answered this question');
        }
      }),

      this.socketService.on<any>('timer_update').subscribe(data => {
        this.timeRemaining = data.remaining;
      }),

      this.socketService.on<any>('answer_submitted').subscribe(data => {
        console.log('✅ Answer submitted:', data);
        this.lastResult = data;
      }),

      this.socketService.on<any>('game_over').subscribe(data => {
        console.log('🏁 Game over!');
        this.gameState = 'finished';
        this.finalLeaderboard = data.leaderboard;
        this.socketService.clearSessionInfo();
      }),

      this.socketService.on<any>('connection_established').subscribe(data => {
        console.log('🔗 Connection established:', data);
      })
    );
  }

  joinGame(): void {
    if (this.playerName.trim() && !this.isJoining) {
      console.log('🚀 Attempting to join game:', this.sessionId, this.playerName);
      this.isJoining = true;
      this.socketService.joinSession(this.sessionId, this.playerName.trim());
      
      // Timeout fallback
      setTimeout(() => {
        if (this.isJoining && !this.joined) {
          console.error('⏱️ Join timeout - no response from server');
          this.isJoining = false;
          alert('Errore di connessione. Riprova.');
        }
      }, 5000);
    }
  }

  selectAnswer(index: number): void {
    if (!this.answered && this.timeRemaining > 0) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer !== -1 && !this.answered) {
      console.log('📝 Submitting answer:', this.selectedAnswer);
      this.socketService.submitAnswer(this.selectedAnswer);
      this.answered = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}