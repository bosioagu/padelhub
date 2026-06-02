import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-primary)] p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-1 mb-2">
            <span class="text-[var(--color-accent)] text-4xl font-black">Padel</span>
            <span class="text-white text-4xl font-black">Hub</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 class="text-2xl font-bold text-[var(--color-primary)] mb-2">Crear cuenta</h2>
          <p class="text-sm text-gray-500 mb-6">Completá tus datos para comenzar</p>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
              ¡Cuenta creada! Revisá tu email para confirmar tu cuenta.
            </div>
          }

          <form (ngSubmit)="onRegister()" #f="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="tu@email.com"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                minlength="6"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Repetir contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                required
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading() || success()"
              class="w-full bg-[var(--color-accent)] text-[var(--color-primary)] font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              @if (loading()) { Creando cuenta... } @else { Crear cuenta }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?
            <a routerLink="/auth/login" class="text-[var(--color-primary)] font-semibold hover:underline ml-1">Iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  async onRegister() {
    this.error.set(null);

    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    const { error } = await this.auth.signUpWithEmail(this.email, this.password);

    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
      return;
    }

    this.success.set(true);
    this.loading.set(false);

    // After email confirmation the user comes back → profile-setup
    setTimeout(() => this.router.navigate(['/auth/profile-setup']), 2000);
  }
}
