import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-add-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-question.component.html',
  styleUrls: ['./add-question.component.scss']
})
export class AddQuestionComponent implements OnInit {
  quizName = '';
  quizTitle = '';
  quizDescription = '';

  // Current question being added
  currentQuestion: Question = {
    question: '',
    answers: ['', '', '', ''],
    correct_answer: 0,
    type: 'text'
  };

  // Questions added in this session
  questionsAdded = 0;

  // UI state
  loading = false;
  loadingQuiz = true;
  error = '';
  success = '';

  // Expose String to template
  String = String;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Get quiz name from URL parameter
    this.route.queryParams.subscribe(params => {
      this.quizName = params['quiz'];
      if (this.quizName) {
        this.loadQuizInfo();
      } else {
        this.error = 'Nome quiz mancante. Impossibile continuare.';
        this.loadingQuiz = false;
      }
    });
  }

  loadQuizInfo(): void {
    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes/${this.quizName}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.quizTitle = response.title || this.quizName;
        this.quizDescription = response.description || '';
        this.loadingQuiz = false;
      },
      error: (err) => {
        this.error = 'Quiz non trovato. Verifica il QR code.';
        this.loadingQuiz = false;
      }
    });
  }

  // TrackBy function for ngFor performance
  trackByIndex(index: number): number {
    return index;
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.error = 'Per favore seleziona un file immagine valido (PNG, JPG, GIF)';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Immagine troppo grande. La dimensione massima è 5MB.';
        return;
      }

      this.currentQuestion.image = file;
      this.error = '';

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
    // Clear previous messages
    this.error = '';
    this.success = '';

    // Validate question
    if (!this.currentQuestion.question.trim()) {
      this.error = 'Il testo della domanda è obbligatorio';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate answers
    const emptyAnswers = this.currentQuestion.answers.filter(a => !a.trim());
    if (emptyAnswers.length > 0) {
      this.error = 'Tutte le 4 risposte devono essere compilate';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate image if type is image
    if (this.currentQuestion.type === 'image' && !this.currentQuestion.image) {
      this.error = 'Seleziona un\'immagine per questa domanda';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.loading = true;

    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes/${this.quizName}/questions`;

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
        this.questionsAdded++;
        this.success = `✅ Domanda ${this.questionsAdded} aggiunta con successo!`;
        
        // Reset form
        this.currentQuestion = {
          question: '',
          answers: ['', '', '', ''],
          correct_answer: 0,
          type: 'text'
        };
        
        this.loading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore nell\'aggiunta della domanda. Riprova.';
        this.loading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  finishAdding(): void {
    if (this.questionsAdded === 0) {
      if (confirm('Non hai aggiunto nessuna domanda. Vuoi davvero uscire?')) {
        this.router.navigate(['/']);
      }
    } else {
      if (confirm(`Hai aggiunto ${this.questionsAdded} domande. Confermi di voler concludere?`)) {
        this.router.navigate(['/']);
      }
    }
  }
}