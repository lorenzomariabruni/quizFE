import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly serverUrl = 'http://localhost:8000';

  constructor() {
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  // Emit events
  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  // Listen to events
  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  // Specific methods
  createSession(sessionId: string): void {
    this.emit('create_session', { session_id: sessionId });
  }

  joinSession(sessionId: string, playerName: string): void {
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
      this.socket.disconnect();
    }
  }
}