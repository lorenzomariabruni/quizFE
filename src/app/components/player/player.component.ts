import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

interface Question {
  question_number: number;
  total_questions: number;
  question: string;
  answers: string[];
  time_limit: number;
  already_answered?: boolean;
  type?: string;
  image_url?: string;
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
  selectedAnswer: number | null = null;
  answered = false;
  pointsEarned = 0;
  totalScore = 0;
  leaderboard: any[] = [];
  timeRemaining = 0;
  error = '';
  joining = false;
  reconnected = false;
  showConnectionBanner = false;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'connecting';
  
  // Results display
  showingResults = false;
  correctAnswer: number | null = null;

  // Expose to template
  String = String;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    // Check for saved session in localStorage
    const savedSession = localStorage.getItem('quiz_session');
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        if (data.sessionId === this.sessionId && data.playerName) {
          this.playerName = data.playerName;
          console.log('Found saved session, will auto-join:', this.playerName);
        }
      } catch (e) {
        console.error('Error parsing saved session:', e);
      }
    }

    this.setupSocketListeners();

    // Auto-join if we have saved credentials
    if (this.playerName && this.sessionId) {
      setTimeout(() => this.joinSession(), 500);
    }
  }

  private setupSocketListeners(): void {
    // Connection status
    this.subscriptions.push(
      this.socketService.on<any>('connection_established').subscribe(() => {
        console.log('✅ Connected to server');
        this.connectionStatus = 'connected';
        this.showConnectionBanner = false;
      })
    );

    // Disconnection
    this.subscriptions.push(
      this.socketService.onDisconnect().subscribe(() => {
        console.log('❌ Disconnected from server');
        this.connectionStatus = 'disconnected';
        this.showConnectionBanner = true;
      })
    );

    // Reconnection
    this.subscriptions.push(
      this.socketService.onReconnect().subscribe((attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.connectionStatus = 'connected';
        this.showConnectionBanner = false;

        // Auto-rejoin if we were in a session
        if (this.joined && this.playerName && this.sessionId) {
          console.log('🔄 Auto-rejoining session...');
          this.socketService.joinSession(this.sessionId, this.playerName);
        }
      })
    );

    // Join response
    this.subscriptions.push(
      this.socketService.on<any>('joined_session').subscribe(data => {
        console.log('✅ Joined session successfully:', data);
        this.joined = true;
        this.joining = false;
        this.reconnected = data.reconnected || false;
        this.gameState = data.game_state || 'waiting';
        this.totalScore = data.total_score || 0;
        this.error = '';

        // Save session to localStorage for recovery
        localStorage.setItem('quiz_session', JSON.stringify({
          sessionId: this.sessionId,
          playerName: this.playerName
        }));

        if (this.reconnected) {
          console.log('🔄 Reconnected to existing session');
        }
      })
    );

    // Error handling
    this.subscriptions.push(
      this.socketService.on<any>('error').subscribe(data => {
        console.error('❌ Error:', data.message);
        this.error = data.message;
        this.joining = false;
      })
    );

    // Game started
    this.subscriptions.push(
      this.socketService.on<any>('game_started').subscribe(() => {
        console.log('🎮 Game started!');
        this.gameState = 'playing';
      })
    );

    // New question
    this.subscriptions.push(
      this.socketService.on<Question>('new_question').subscribe(question => {
        console.log('📥 Received new question:', question);
        this.currentQuestion = question;
        this.selectedAnswer = null;
        this.answered = question.already_answered || false;
        this.pointsEarned = 0;
        this.timeRemaining = question.time_limit;
        this.showingResults = false;
        this.correctAnswer = null;

        // Build full image URL if needed
        if (question.type === 'image' && question.image_url) {
          const host = window.location.hostname;
          this.currentQuestion.image_url = `http://${host}:8000${question.image_url}`;
        }

        if (this.answered) {
          console.log('⚠️ Already answered this question');
        }
      })
    );

    // Timer update
    this.subscriptions.push(
      this.socketService.on<any>('timer_update').subscribe(data => {
        this.timeRemaining = data.remaining;
      })
    );

    // Answer submitted - NO correctness info
    this.subscriptions.push(
      this.socketService.on<any>('answer_submitted').subscribe(data => {
        console.log('✅ Answer submitted:', data);
        this.answered = true;
        this.pointsEarned = data.points_earned;
        // Don't update totalScore here - wait for results
      })
    );

    // Question results - NOW we show correctness
    this.subscriptions.push(
      this.socketService.on<any>('question_results').subscribe(data => {
        console.log('📈 Question results:', data);
        this.showingResults = true;
        this.correctAnswer = data.correct_answer;
        this.leaderboard = data.leaderboard;
        
        // Update total score from leaderboard
        const myResult = this.leaderboard.find(p => p.name === this.playerName);
        if (myResult) {
          this.totalScore = myResult.score;
        }
      })
    );

    // Game over
    this.subscriptions.push(
      this.socketService.on<any>('game_over').subscribe(data => {
        console.log('🏁 Game over:', data);
        this.gameState = 'finished';
        this.leaderboard = data.leaderboard;
        // Clear saved session
        localStorage.removeItem('quiz_session');
      })
    );
  }

  joinSession(): void {
    if (this.playerName.trim() && this.sessionId) {
      this.joining = true;
      this.error = '';
      this.socketService.joinSession(this.sessionId, this.playerName.trim());

      // Timeout fallback
      setTimeout(() => {
        if (this.joining) {
          this.error = 'Errore di connessione. Riprova.';
          this.joining = false;
        }
      }, 5000);
    }
  }

  selectAnswer(index: number): void {
    if (!this.answered && !this.showingResults) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer !== null && !this.answered && !this.showingResults) {
      this.socketService.submitAnswer(this.selectedAnswer);
    }
  }

  isCorrectAnswer(index: number): boolean {
    return this.showingResults && this.correctAnswer === index;
  }

  isWrongAnswer(index: number): boolean {
    return this.showingResults && this.selectedAnswer === index && this.correctAnswer !== index;
  }

  goHome(): void {
    localStorage.removeItem('quiz_session');
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}