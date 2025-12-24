import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private serverUrl: string;

  constructor() {
    // Use current hostname and connect to backend on port 8000
    const host = window.location.hostname;
    const port = '8000';
    this.serverUrl = `http://${host}:${port}`;

    console.log('🔌 Connecting to:', this.serverUrl);

    this.socket = io(this.serverUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    });
  }

  // Generic event listener
  on<T>(eventName: string): Observable<T> {
    return fromEvent(this.socket, eventName);
  }

  // Disconnect listener
  onDisconnect(): Observable<string> {
    return fromEvent(this.socket, 'disconnect');
  }

  // Reconnect listener
  onReconnect(): Observable<number> {
    return fromEvent(this.socket, 'reconnect');
  }

  // Create session (host)
  createSession(sessionId: string, quizName: string | null = null): void {
    console.log('📤 Emitting create_session:', { session_id: sessionId, quiz_name: quizName });
    this.socket.emit('create_session', { 
      session_id: sessionId,
      quiz_name: quizName
    });
  }

  // Join session (player)
  joinSession(sessionId: string, playerName: string): void {
    console.log('📤 Emitting join_session:', { session_id: sessionId, player_name: playerName });
    this.socket.emit('join_session', {
      session_id: sessionId,
      player_name: playerName
    });
  }

  // Start game (host)
  startGame(sessionId: string): void {
    console.log('📤 Emitting start_game:', { session_id: sessionId });
    this.socket.emit('start_game', { session_id: sessionId });
  }

  // Submit answer (player)
  submitAnswer(answerIndex: number): void {
    console.log('📤 Emitting submit_answer:', { answer_index: answerIndex });
    this.socket.emit('submit_answer', { answer_index: answerIndex });
  }
}