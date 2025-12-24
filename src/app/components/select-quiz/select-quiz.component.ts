import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Quiz {
  name: string;
  title: string;
  description: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-select-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-quiz.component.html',
  styleUrls: ['./select-quiz.component.scss']
})
export class SelectQuizComponent implements OnInit {
  quizzes: Quiz[] = [];
  loading = true;
  error = '';
  selectedQuiz: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes`;

    this.http.get<{quizzes: Quiz[]}>(apiUrl).subscribe({
      next: (response) => {
        this.quizzes = response.quizzes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore nel caricamento dei quiz';
        this.loading = false;
        console.error('Error loading quizzes:', err);
      }
    });
  }

  selectQuiz(quizName: string): void {
    this.selectedQuiz = quizName;
  }

  createSession(): void {
    if (this.selectedQuiz) {
      this.router.navigate(['/host', this.selectedQuiz]);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}