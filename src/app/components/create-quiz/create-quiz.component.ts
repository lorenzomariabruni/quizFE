import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Question {
  id?: string;
  question: string;
  answers: string[];
  correct_answer: number;
  type: 'text' | 'image';
  image?: string | File;
  imagePreview?: string;
}

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.scss']
})
export class CreateQuizComponent {
  // Quiz metadata
  quizName = '';
  quizTitle = '';
  quizDescription = '';
  quizCreated = false;
  createdQuizName = '';

  // Current question being added
  currentQuestion: Question = {
    question: '',
    answers: ['', '', '', ''],
    correct_answer: 0,
    type: 'text'
  };

  // Questions added
  questions: Question[] = [];

  // UI state
  loading = false;
  error = '';
  success = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  createQuiz(): void {
    if (!this.quizName.trim() || !this.quizTitle.trim()) {
      this.error = 'Nome e titolo quiz sono obbligatori';
      return;
    }

    this.loading = true;
    this.error = '';

    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes`;

    const formData = new FormData();
    formData.append('name', this.quizName.trim());
    formData.append('title', this.quizTitle.trim());
    formData.append('description', this.quizDescription.trim());

    this.http.post<{name: string, message: string}>(apiUrl, formData).subscribe({
      next: (response) => {
        this.quizCreated = true;
        this.createdQuizName = response.name;
        this.success = 'Quiz creato! Ora aggiungi delle domande.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore nella creazione del quiz';
        this.loading = false;
      }
    });
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Per favore seleziona un file immagine';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Immagine troppo grande (max 5MB)';
        return;
      }

      this.currentQuestion.image = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentQuestion.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.currentQuestion.image = undefined;
    this.currentQuestion.imagePreview = undefined;
  }

  addQuestion(): void {
    // Validate
    if (!this.currentQuestion.question.trim()) {
      this.error = 'Il testo della domanda è obbligatorio';
      return;
    }

    if (this.currentQuestion.answers.some(a => !a.trim())) {
      this.error = 'Tutte le risposte devono essere compilate';
      return;
    }

    if (this.currentQuestion.type === 'image' && !this.currentQuestion.image) {
      this.error = 'Seleziona un\'immagine per questa domanda';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes/${this.createdQuizName}/questions`;

    const formData = new FormData();
    formData.append('question_text', this.currentQuestion.question.trim());
    formData.append('answer_0', this.currentQuestion.answers[0].trim());
    formData.append('answer_1', this.currentQuestion.answers[1].trim());
    formData.append('answer_2', this.currentQuestion.answers[2].trim());
    formData.append('answer_3', this.currentQuestion.answers[3].trim());
    formData.append('correct_answer', this.currentQuestion.correct_answer.toString());
    formData.append('question_type', this.currentQuestion.type);

    if (this.currentQuestion.image instanceof File) {
      formData.append('image', this.currentQuestion.image);
    }

    this.http.post<any>(apiUrl, formData).subscribe({
      next: (response) => {
        this.questions.push({...this.currentQuestion, id: response.question_id});
        this.success = `Domanda aggiunta! (${this.questions.length} totali)`;
        
        // Reset form
        this.currentQuestion = {
          question: '',
          answers: ['', '', '', ''],
          correct_answer: 0,
          type: 'text'
        };
        
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore nell\'aggiunta della domanda';
        this.loading = false;
      }
    });
  }

  finishQuiz(): void {
    if (this.questions.length === 0) {
      this.error = 'Aggiungi almeno una domanda prima di completare';
      return;
    }

    this.router.navigate(['/']);
  }

  goBack(): void {
    if (confirm('Sei sicuro? Le modifiche non salvate andranno perse.')) {
      this.router.navigate(['/']);
    }
  }
}