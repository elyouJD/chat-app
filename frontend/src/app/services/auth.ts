import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'https://chat-app-backend-m1o3.onrender.com/api';

  constructor(private http: HttpClient) {}

  // =========================
  // LOGIN
  // =========================
  login(email: string, password: string): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/login`,
      {
        email: email,
        password: password
      },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    );
  }

  // =========================
  // REGISTER
  // =========================
  register(user: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/register`,
      user,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    );
  }

  // =========================
  // TOKEN
  // =========================
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // =========================
  // AUTH HEADERS
  // =========================
  private getAuthHeaders(): HttpHeaders {

    const token = this.getToken();

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // =========================
  // GET USERS
  // =========================
  getUsers(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/users`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  // =========================
  // GET ME
  // =========================
  getMe(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/me`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  // =========================
  // GET USER
  // =========================
  getUser(id: number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/users/${id}`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  // =========================
  // UPDATE PROFILE
  // =========================
  updateMe(data: any): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/me`,
      data,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  // =========================
  // UPLOAD PHOTO
  // =========================
  uploadPhoto(file: File): Observable<any> {

    const formData = new FormData();

    formData.append('photo', file);

    const token = this.getToken();

    return this.http.post<any>(
      `${this.apiUrl}/upload`,
      formData,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      }
    );
  }

  // =========================
  // LOGOUT
  // =========================
  logout(): void {
    localStorage.removeItem('token');
  }

  // =========================
  // IS LOGGED
  // =========================
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}