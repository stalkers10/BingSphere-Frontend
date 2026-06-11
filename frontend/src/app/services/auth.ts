import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { apiUrl } from '../config/runtime-config';
import { ApiService } from './api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = apiUrl();

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
  ) {}

  register(user: any) {
    return this.http.post(`${this.baseUrl}register/`, user);
  }

  login(credentials: any) {
    return this.http.post(`${this.baseUrl}token/`, credentials).pipe(
      tap((res: any) => {
        this.apiService.clearProfileState();
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
      })
    );
  }

  logout() {
    this.apiService.clearProfileState();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
