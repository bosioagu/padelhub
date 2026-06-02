import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-40">
      <!-- Logo (mobile) / breadcrumb area -->
      <div class="flex items-center gap-2">
        <a routerLink="/" class="flex items-center gap-1 md:hidden">
          <span class="text-[var(--color-primary)] font-black text-xl">Padel</span>
          <span class="text-[var(--color-accent)] font-black text-xl" style="background:var(--color-primary);padding:0 4px;border-radius:4px">Hub</span>
        </a>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- Mock mode badge + role toggle -->
        @if (isMock) {
          <button (click)="auth.toggleMockRole()"
            class="hidden md:flex items-center gap-1 text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-full border border-amber-300 hover:bg-amber-200 transition-colors">
            <span class="material-icons-round text-sm">swap_horiz</span>
            {{ isAdmin() ? 'Ver como Player' : 'Ver como Admin' }}
          </button>
        }

        @if (isAuthenticated()) {
          <!-- Notifications bell -->
          <button class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span class="material-icons-round text-gray-600 text-xl">notifications_none</span>
            @if (hasNotifications()) {
              <span class="absolute top-1 right-1 w-2 h-2 bg-[var(--color-accent)] rounded-full"></span>
            }
          </button>

          <!-- Avatar + dropdown -->
          <div class="relative">
            <button
              (click)="menuOpen.set(!menuOpen())"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold">
                {{ initials() }}
              </div>
              <span class="hidden md:inline text-sm font-medium text-gray-700">{{ profileName() }}</span>
              <span class="material-icons-round text-gray-400 text-sm">expand_more</span>
            </button>

            @if (menuOpen()) {
              <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <a routerLink="/profile" (click)="menuOpen.set(false)"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <span class="material-icons-round text-base">person</span> Mi perfil
                </a>
                @if (isAdmin()) {
                  <a routerLink="/admin" (click)="menuOpen.set(false)"
                    class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <span class="material-icons-round text-base">dashboard</span> Admin
                  </a>
                }
                <hr class="my-1 border-gray-100">
                <button (click)="onSignOut()"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                  <span class="material-icons-round text-base">logout</span> Cerrar sesión
                </button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/auth/login"
            class="text-sm font-semibold text-[var(--color-primary)] hover:underline">
            Iniciar sesión
          </a>
          <a routerLink="/auth/register"
            class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Registrarse
          </a>
        }
      </div>
    </header>
  `,
})
export class TopNavComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly isMock = environment.useMock;

  menuOpen = signal(false);
  hasNotifications = signal(false); // Will be driven by NotificationService

  isAuthenticated = this.auth.isAuthenticated;
  isAdmin = this.auth.isAdmin;

  profileName = () => this.auth.profile()?.full_name?.split(' ')[0] ?? 'Usuario';

  initials = () => {
    const name = this.auth.profile()?.full_name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  async onSignOut() {
    this.menuOpen.set(false);
    await this.auth.signOut();
  }
}
