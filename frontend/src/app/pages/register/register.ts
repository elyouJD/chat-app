import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  age: number | null = null;
  city = '';
  gender = '';
  description = '';

  errorMessage = '';
  successMessage = '';

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      username: this.username,
      email: this.email,
      password: this.password,
      age: this.age,
      city: this.city,
      gender: this.gender,
      description: this.description,
    };

    this.auth.register(data).subscribe({
      next: (response) => {
        console.log('Registration réussie:', response);

        this.successMessage = 'Compte créé avec succès !';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      error: (error) => {
        console.error('Registration error:', error);

        this.errorMessage =
          error.error?.message || 'Une erreur est survenue lors de la création du compte.';
      },
    });
  }
}
