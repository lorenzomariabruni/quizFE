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

  // Expose to template
  String = String;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    // Listen to events
    this.subscriptions.push(
      this.socketService.on<any>('joined_session').subscribe(() => {
        this.joined = true;
      }),

      this.socketService.on<any>('error').subscribe(data => {
        alert(data.message);
      }),

      this.socketService.on<any>('game_started').subscribe(() => {
        this.gameState = 'playing';
      }),

      this.socketService.on<Question>('new_question').subscribe(question => {
        this.currentQuestion = question;
        this.selectedAnswer = -1;
        this.answered = false;
        this.timeRemaining = question.time_limit;
        this.lastResult = null;
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