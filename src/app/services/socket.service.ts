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
  private isDisconnected = false;

  constructor() {
    // Use current host instead of hardcoded localhost
    const host = window.location.hostname;
    const port = '8000'; // Backend port
    this.serverUrl = `http://${host}:${port}`;

    console.log('🌐 Connecting to backend at:', this.serverUrl);

    this.socket = io(this.serverUrl, {
      transports: ['polling', 'websocket'],  // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
      console.log('📡 Transport:', this.socket.io.engine.transport.name);
      this.connectionStatus.next(true);
      
      // Auto-rejoin ONLY if we were previously disconnected
      if (this.sessionInfo && this.isDisconnected) {
        console.log('🔄 Auto-rejoining after disconnect:', this.sessionInfo);
        setTimeout(() => {
          if (this.sessionInfo) {
            this.socket.emit('join_session', {
              session_id: this.sessionInfo.sessionId,
              player_name: this.sessionInfo.playerName
            });
          }
        }, 300);
        this.isDisconnected = false;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connectionStatus.next(false);
      if (this.sessionInfo) {
        this.isDisconnected = true;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      this.connectionStatus.next(false);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt #' + attemptNumber);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.io.engine.on('upgrade', (transport: any) => {
      console.log('⬆️ Transport upgraded to:', transport.name);
    });
  }

  // Store session info for reconnection
  setSessionInfo(sessionId: string, playerName: string): void {
    this.sessionInfo = { sessionId, playerName };
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
    this.isDisconnected = false;
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

  // Get connection state for debugging
  getConnectionState(): any {
    return {
      connected: this.socket.connected,
      disconnected: this.socket.disconnected,
      id: this.socket.id,
      transport: this.socket.io.engine?.transport?.name
    };
  }

  // Specific methods
  createSession(sessionId: string): void {
    this.emit('create_session', { session_id: sessionId });
  }

  joinSession(sessionId: string, playerName: string): void {
    console.log('🎮 Joining session:', sessionId, playerName);
    console.log('🔍 Connection state:', this.getConnectionState());
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