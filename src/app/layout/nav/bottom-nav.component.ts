import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav md:hidden">
      <a routerLink="/courts" routerLinkActive="active">
        <span class="material-icons-round text-2xl">sports_tennis</span>
        <span>Canchas</span>
      </a>
      <a routerLink="/bookings" routerLinkActive="active">
        <span class="material-icons-round text-2xl">event</span>
        <span>Reservas</span>
      </a>
      <a routerLink="/match-results" routerLinkActive="active">
        <span class="material-icons-round text-2xl">emoji_events</span>
        <span>Resultados</span>
      </a>
      <a routerLink="/academy" routerLinkActive="active">
        <span class="material-icons-round text-2xl">school</span>
        <span>Academia</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active">
        <span class="material-icons-round text-2xl">person</span>
        <span>Perfil</span>
      </a>
    </nav>
  `,
})
export class BottomNavComponent {}
