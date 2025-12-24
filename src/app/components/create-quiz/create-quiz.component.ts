import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as QRCode from 'qrcode';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.scss']
})
export class CreateQuizComponent implements OnInit, OnDestroy {
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

  // Question count
  questionCount = 0;

  // UI state
  loading = false;
  error = '';
  success = '';

  // Polling subscription
  private pollingSubscription?: Subscription;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Don't auto-detect IP, will prompt when needed
  }

  ngOnDestroy() {
    // Clean up polling when component is destroyed
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
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
        this.success = 'Quiz creato con successo! Condividi il QR code per aggiungere domande.';
        this.loading = false;

        // Prompt for IP to generate QR code
        await this.generateQRCode();

        // Start polling for question count
        this.startPollingQuestionCount();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore nella creazione del quiz';
        this.loading = false;
      }
    });
  }

  private startPollingQuestionCount(): void {
    // Poll every 2 seconds
    this.pollingSubscription = interval(2000).subscribe(() => {
      this.fetchQuestionCount();
    });

    // Fetch immediately
    this.fetchQuestionCount();
  }

  private fetchQuestionCount(): void {
    const host = window.location.hostname;
    const apiUrl = `http://${host}:8000/api/quizzes/${this.createdQuizName}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.questionCount = response.question_count || 0;
      },
      error: (err) => {
        // Silently fail, don't show error to user
        console.error('Error fetching question count:', err);
      }
    });
  }

  private async generateQRCode(): Promise<void> {
    // Always prompt for IP
    this.networkIp = await this.promptForIp();
    
    const port = window.location.port ? `:${window.location.port}` : '';
    this.addQuestionUrl = `http://${this.networkIp}${port}/add-question?quiz=${this.createdQuizName}`;
    this.qrCodeUrl = await QRCode.toDataURL(this.addQuestionUrl, { 
      width: 500,
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

  playQuiz(): void {
    if (this.questionCount === 0) {
      alert('⚠️ Devi aggiungere almeno una domanda prima di giocare!');
      return;
    }

    // Stop polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    // Navigate to host page with quiz name
    this.router.navigate(['/host', this.createdQuizName]);
  }

  finishQuiz(): void {
    if (this.questionCount === 0) {
      if (!confirm('Non sono state aggiunte domande. Vuoi davvero completare il quiz?')) {
        return;
      }
    } else {
      if (!confirm(`Il quiz contiene ${this.questionCount} domande. Confermi di voler completare?`)) {
        return;
      }
    }

    // Stop polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    this.router.navigate(['/']);
  }

  goBack(): void {
    const message = this.quizCreated 
      ? `Sei sicuro di voler uscire? Il quiz "${this.quizTitle}" contiene ${this.questionCount} domande.`
      : 'Sei sicuro di voler annullare? I dati inseriti andranno persi.';
    
    if (confirm(message)) {
      // Stop polling
      if (this.pollingSubscription) {
        this.pollingSubscription.unsubscribe();
      }
      this.router.navigate(['/']);
    }
  }
}