import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as QRCode from 'qrcode';

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
export class CreateQuizComponent implements OnInit {
  // Quiz metadata
  quizName = '';
  quizTitle = '';
  quizDescription = '';
  quizCreated = false;
  createdQuizName = '';

  // QR Code for sharing
  qrCodeUrl = '';
  addQuestionUrl = '';
  networkIp = '';

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

  // Expose String to template
  String = String;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Don't auto-detect IP, will prompt when needed
  }

  async createQuiz(): Promise<void> {
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
      next: async (response) => {
        this.quizCreated = true;
        this.createdQuizName = response.name;
        this.success = 'Quiz creato con successo! Ora puoi aggiungere le domande.';
        this.loading = false;

        // Prompt for IP to generate QR code
        await this.generateQRCode();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore nella creazione del quiz';
        this.loading = false;
      }
    });
  }

  private async generateQRCode(): Promise<void> {
    // Always prompt for IP
    this.networkIp = await this.promptForIp();
    
    const port = window.location.port ? `:${window.location.port}` : '';
    this.addQuestionUrl = `http://${this.networkIp}${port}/create-quiz?quiz=${this.createdQuizName}`;
    this.qrCodeUrl = await QRCode.toDataURL(this.addQuestionUrl, { 
      width: 300,
      margin: 2,
      color: {
        dark: '#667eea',
        light: '#ffffff'
      }
    });
  }

  private promptForIp(): string {
    const defaultIp = window.location.hostname;
    const manualIp = prompt(
      '🌐 Inserisci l\'IP di questa macchina per generare il QR code\n\n' +
      'Questo permetterà ad altri dispositivi di accedere alla pagina.\n\n' +
      'Per trovare il tuo IP:\n' +
      '• Mac/Linux: ifconfig | grep "inet "\n' +
      '• Windows: ipconfig\n\n' +
      'Lascia vuoto per usare: ' + defaultIp,
      defaultIp
    );
    return manualIp && manualIp.trim() ? manualIp.trim() : defaultIp;
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
        this.success = `✅ Domanda ${this.questions.length} aggiunta con successo!`;
        
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

  finishQuiz(): void {
    if (this.questions.length === 0) {
      this.error = 'Aggiungi almeno una domanda prima di completare il quiz';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (confirm(`Hai aggiunto ${this.questions.length} domande. Confermi di voler completare il quiz?`)) {
      this.router.navigate(['/']);
    }
  }

  goBack(): void {
    const message = this.quizCreated 
      ? `Sei sicuro di voler uscire? Hai già creato il quiz "${this.quizTitle}" con ${this.questions.length} domande.`
      : 'Sei sicuro di voler annullare? I dati inseriti andranno persi.';
    
    if (confirm(message)) {
      this.router.navigate(['/']);
    }
  }
}