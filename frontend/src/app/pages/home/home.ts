import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  users: any[] = [];

  ngOnInit(): void {
    this.auth.getUsers().subscribe({
      next: (response) => {
        console.log('API RESPONSE:', response);

        this.users = response.member ?? [];

        console.log('USERS:', this.users);
        console.log('PHOTO:', this.users[0]?.photo);
      },

      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);

        if (error.status === 401) {
          this.logout();
        }
      },
    });
  }

  logout(event?: Event): void {
    event?.preventDefault();

    this.auth.logout();

    this.router.navigate(['/login']);
  }
}
