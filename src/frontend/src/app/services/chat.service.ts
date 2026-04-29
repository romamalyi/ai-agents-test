import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatRequest {
  message: string;
  channelId: string;
  conversationHistory: { role: string; content: string }[];
  context?: string;
}

export interface ChatResponse {
  message: string;
  isError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.backendUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, request).pipe(
      catchError(error => {
        console.error('Chat API error:', error);
        return of({
          message: 'Unable to reach Leo backend. Please ensure the backend server is running.',
          isError: true
        });
      })
    );
  }
}
