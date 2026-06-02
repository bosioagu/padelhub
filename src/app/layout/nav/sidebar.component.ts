import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-60 bg-[var(--color-primary)] flex flex-col min-h-screen sticky top-0">
      <!-- Logo -->
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center gap-1">
          <span class="text-white font-black text-2xl">Padel</span>
          <span class="text-[var(--color-accent)] font-black text-2xl">Hub</span>
        </div>
        <p class="text-white/40 text-xs mt-0.5">Tu plataforma de pádel</p>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        @for (item of visibleItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-white/15 text-white"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <span class="material-icons-round text-xl">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Footer: role badge -->
      <div class="px-5 py-4 border-t border-white/10">
        @if (isAdmin()) {
          <span class="inline-flex items-center gap-1 bg-[var(--color-accent)] text-[var(--color-primary)] text-xs font-bold px-2 py-1 rounded-full">
            <span class="material-icons-round text-xs">verified</span> Administrador
          </span>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private auth = inject(AuthService);

  isAdmin = this.auth.isAdmin;

  private readonly allItems: NavItem[] = [
    { label: 'Canchas', icon: 'sports_tennis', route: '/courts' },
    { label: 'Mis reservas', icon: 'event', route: '/bookings', adminOnly: false },
    { label: 'Resultados', icon: 'emoji_events', route: '/match-results' },
    { label: 'Academia', icon: 'school', route: '/academy' },
    { label: 'Dashboard Admin', icon: 'dashboard', route: '/admin', adminOnly: true },
    { label: 'Jugadores', icon: 'people', route: '/admin/players', adminOnly: true },
    { label: 'Notificaciones', icon: 'notifications', route: '/admin/notifications', adminOnly: true },
  ];

  visibleItems() {
    const admin = this.isAdmin();
    return this.allItems.filter(i => {
      if (i.adminOnly === true) return admin;
      if (i.adminOnly === false) return true;
      return true;
    });
  }
}
