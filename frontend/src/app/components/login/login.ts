import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { apiUrl } from '../../config/runtime-config';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = '';
  password = '';

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    const credentials = { username: this.username, password: this.password };
    let auth=this.http.post(apiUrl('token/'), credentials)
    auth.subscribe({
      next: (res: any) => {
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        this.router.navigate(['/']);
      },
      error: (err) => alert('Invalid Credentials!')
    });
  }
}
