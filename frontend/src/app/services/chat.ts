import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: number;
  sender: number;
  receiver: number;
  content: string;

  type?: 'text' | 'image' | 'video';

  mediaUrl?: string | null;

  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private http = inject(HttpClient);

  private apiUrl = 'https://chat-app-backend-m1o3.onrender.com/api';

  // =========================================================
  // HEADERS
  // =========================================================

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // =========================================================
  // GET MESSAGES
  // =========================================================

  getMessages(userId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/${userId}`, {
      headers: this.getHeaders(),
    });
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  sendMessage(
    receiver: number,
    content: string,
    type: 'text' | 'image' | 'video' = 'text',
    mediaUrl: string | null = null,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/send-message`,
      {
        receiver: receiver,
        content: content,
        type: type,
        mediaUrl: mediaUrl,
      },
      {
        headers: this.getHeaders(),
      },
    );
  }

  // =========================================================
  // UPLOAD IMAGE / VIDEO
  // =========================================================

  uploadChatFile(file: File): Observable<any> {
    const token = localStorage.getItem('token');

    const formData = new FormData();

    formData.append('file', file);

    /*
     * مهم:
     * هنا ما نديروش Content-Type.
     *
     * Browser هو اللي كيدير:
     * multipart/form-data
     * مع boundary
     */

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.apiUrl}/chat/upload`, formData, {
      headers: headers,
    });
  }

  // =========================================================
  // DELETE MESSAGE
  // =========================================================

  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/messages/${messageId}`, {
      headers: this.getHeaders(),
    });
  }
}
