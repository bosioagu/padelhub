import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { PlayerLevel } from '../../../core/models/database.types';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-primary)] p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <span class="text-[var(--color-accent)] text-4xl font-black">Padel</span>
          <span class="text-white text-4xl font-black">Hub</span>
        </div>

        <div class="bg-white rounded-2xl p-8 shadow-2xl">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-3">
              <span class="material-icons-round text-[var(--color-primary)] text-3xl">sports_tennis</span>
            </div>
            <h2 class="text-2xl font-bold text-[var(--color-primary)]">Completá tu perfil</h2>
            <p class="text-sm text-gray-500 mt-1">Queremos conocerte mejor</p>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSave()" #f="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                name="fullName"
                [(ngModel)]="fullName"
                required
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Juan Pérez"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
              <input
                type="tel"
                name="phone"
                [(ngModel)]="phone"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Nivel de juego</label>
              <div class="grid grid-cols-3 gap-3">
                @for (level of levels; track level.value) {
                  <button
                    type="button"
                    (click)="selectedLevel = level.value"
                    class="py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all text-center"
                    [ngClass]="selectedLevel === level.value ? 'chip-selected' : 'chip-unselected'"
                  >
                    <div class="text-xl mb-1">{{ level.emoji }}</div>
                    {{ level.label }}
                  </button>
                }
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full bg-[var(--color-accent)] text-[var(--color-primary)] font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              @if (loading()) { Guardando... } @else { ¡Empezar a jugar! }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class ProfileSetupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  phone = '';
  selectedLevel: PlayerLevel = 'beginner';
  loading = signal(false);
  error = signal<string | null>(null);

  levels: { value: PlayerLevel; label: string; emoji: string }[] = [
    { value: 'beginner', label: 'Principiante', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermedio', emoji: '⚡' },
    { value: 'advanced', label: 'Avanzado', emoji: '🔥' },
  ];

  async onSave() {
    if (!this.fullName.trim()) {
      this.error.set('El nombre es requerido.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    await this.auth.createProfile({
      full_name: this.fullName.trim(),
      phone: this.phone || null,
      role: 'player',
      level: this.selectedLevel,
      notification_prefs: { email_24h: true, push_1h: true, match_prompt: true },
      avatar_url: null,
    });

    this.router.navigate(['/courts']);
  }
}
