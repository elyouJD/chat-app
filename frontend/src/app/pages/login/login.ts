import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);

  email = '';
  password = '';

  errorMessage = '';

  login(): void {
    this.errorMessage = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (response) => {
        // تخزين JWT
        localStorage.setItem('token', response.token);

        console.log('Login réussi');

        // الانتقال للصفحة الرئيسية
        this.router.navigate(['/home']);
      },

      error: (error) => {
        console.error('Login error:', error);

        this.errorMessage = 'Email ou mot de passe incorrect.';
      },
    });
  }
}
