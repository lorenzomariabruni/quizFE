import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private serverUrl: string;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  // Store session info for reconnection
  private sessionInfo: { sessionId: string; playerName: string } | null = null;

  constructor() {
    // Use current host instead of hardcoded localhost
    const host = window.location.hostname;
    const port = '8000'; // Backend port
    this.serverUrl = `http://${host}:${port}`;

    console.log('Connecting to backend at:', this.serverUrl);

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
      this.connectionStatus.next(true);
      
      // Auto-rejoin session if we have stored info
      if (this.sessionInfo) {
        console.log('🔄 Auto-rejoining session:', this.sessionInfo);
        setTimeout(() => {
          this.socket.emit('join_session', {
            session_id: this.sessionInfo!.sessionId,
            player_name: this.sessionInfo!.playerName
          });
        }, 100); // Small delay to ensure socket is fully ready
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
      this.connectionStatus.next(false);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt #' + attemptNumber);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });
  }

  // Store session info for reconnection
  setSessionInfo(sessionId: string, playerName: string): void {
    this.sessionInfo = { sessionId, playerName };
    // Store in localStorage for page refresh recovery
    localStorage.setItem('quiz_session', JSON.stringify(this.sessionInfo));
    console.log('💾 Session info stored:', this.sessionInfo);
  }

  // Get stored session info
  getSessionInfo(): { sessionId: string; playerName: string } | null {
    if (this.sessionInfo) {
      return this.sessionInfo;
    }
    
    const stored = localStorage.getItem('quiz_session');
    if (stored) {
      try {
        this.sessionInfo = JSON.parse(stored);
        console.log('📦 Session info loaded from storage:', this.sessionInfo);
        return this.sessionInfo;
      } catch (e) {
        console.error('❌ Failed to parse stored session');
        localStorage.removeItem('quiz_session');
      }
    }
    return null;
  }

  // Clear session info
  clearSessionInfo(): void {
    this.sessionInfo = null;
    localStorage.removeItem('quiz_session');
    console.log('🗑️ Session info cleared');
  }

  // Emit events
  emit(event: string, data: any): void {
    console.log('📤 Emitting:', event, data);
    this.socket.emit(event, data);
  }

  // Listen to events
  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      this.socket.on(event, (data: T) => {
        console.log('📥 Received:', event, data);
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket.connected;
  }

  // Specific methods
  createSession(sessionId: string): void {
    this.emit('create_session', { session_id: sessionId });
  }

  joinSession(sessionId: string, playerName: string): void {
    console.log('🎮 Joining session:', sessionId, playerName);
    this.setSessionInfo(sessionId, playerName);
    this.emit('join_session', { session_id: sessionId, player_name: playerName });
  }

  startGame(sessionId: string): void {
    this.emit('start_game', { session_id: sessionId });
  }

  submitAnswer(answerIndex: number): void {
    this.emit('submit_answer', { answer_index: answerIndex });
  }

  disconnect(): void {
    if (this.socket) {
      this.clearSessionInfo();
      this.socket.disconnect();
    }
  }
}