import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayerLevel, NotificationPrefs } from '../../core/models/database.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-[var(--color-primary)] mb-6">Mi perfil</h1>

      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">
          Perfil actualizado correctamente.
        </div>
      }

      <div class="card mb-5">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-black">
            {{ initials() }}
          </div>
          <div>
            <h2 class="font-bold text-gray-900 text-lg">{{ profile()?.full_name }}</h2>
            <span class="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-semibold">
              {{ levelLabel(profile()?.level) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Nombre completo</label>
            <input type="text" [(ngModel)]="form.full_name"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
            <input type="tel" [(ngModel)]="form.phone"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-600 mb-2">Nivel</label>
          <div class="flex gap-2">
            @for (l of levels; track l.value) {
              <button type="button" (click)="form.level = l.value"
                class="flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                [ngClass]="form.level === l.value ? 'chip-selected' : 'chip-unselected'">
                {{ l.emoji }} {{ l.label }}
              </button>
            }
          </div>
        </div>

        <button (click)="saveProfile()" [disabled]="saving()"
          class="bg-[var(--color-primary)] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
          @if (saving()) { Guardando... } @else { Guardar cambios }
        </button>
      </div>

      <!-- Notification preferences -->
      <div class="card">
        <h2 class="font-bold text-gray-800 mb-4">Preferencias de notificación</h2>

        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium text-gray-700">Email recordatorio 24h</p>
              <p class="text-xs text-gray-400">Email 24hs antes de tu reserva</p>
            </div>
            <button type="button" (click)="togglePref('email_24h')"
              class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              [ngClass]="prefs().email_24h ? 'toggle-on' : 'toggle-off'">
              <div class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class.translate-x-5]="prefs().email_24h"
                [class.translate-x-0]="!prefs().email_24h">
              </div>
            </button>
          </label>

          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium text-gray-700">Push 1h antes</p>
              <p class="text-xs text-gray-400">Notificación push 1 hora antes</p>
            </div>
            <button type="button" (click)="togglePref('push_1h')"
              class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              [ngClass]="prefs().push_1h ? 'toggle-on' : 'toggle-off'">
              <div class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class.translate-x-5]="prefs().push_1h"
                [class.translate-x-0]="!prefs().push_1h">
              </div>
            </button>
          </label>

          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium text-gray-700">Registrar resultado</p>
              <p class="text-xs text-gray-400">Recordatorio para cargar resultado post-partido</p>
            </div>
            <button type="button" (click)="togglePref('match_prompt')"
              class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              [ngClass]="prefs().match_prompt ? 'toggle-on' : 'toggle-off'">
              <div class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class.translate-x-5]="prefs().match_prompt"
                [class.translate-x-0]="!prefs().match_prompt">
              </div>
            </button>
          </label>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <button (click)="requestPush()"
            class="text-sm text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1">
            <span class="material-icons-round text-base">notifications_active</span>
            Activar notificaciones push del navegador
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private notificationsService = inject(NotificationsService);

  profile = this.auth.profile;
  saving = signal(false);
  success = signal(false);

  form: { full_name: string; phone: string; level: PlayerLevel } = {
    full_name: '', phone: '', level: 'beginner',
  };

  prefs = signal<NotificationPrefs>({ email_24h: true, push_1h: true, match_prompt: true });

  readonly levels = [
    { value: 'beginner' as PlayerLevel, label: 'Principiante', emoji: '🌱' },
    { value: 'intermediate' as PlayerLevel, label: 'Intermedio', emoji: '⚡' },
    { value: 'advanced' as PlayerLevel, label: 'Avanzado', emoji: '🔥' },
  ];

  levelLabel = (l?: string) => this.levels.find(x => x.value === l)?.label ?? '';
  initials = () => {
    const name = this.profile()?.full_name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  ngOnInit() {
    const p = this.profile();
    if (p) {
      this.form = { full_name: p.full_name, phone: p.phone ?? '', level: p.level };
      this.prefs.set({ ...p.notification_prefs });
    }
  }

  async saveProfile() {
    this.saving.set(true);
    await this.auth.updateProfile({
      full_name: this.form.full_name,
      phone: this.form.phone || null,
      level: this.form.level,
      notification_prefs: this.prefs(),
    });
    this.success.set(true);
    this.saving.set(false);
    setTimeout(() => this.success.set(false), 3000);
  }

  async togglePref(key: keyof NotificationPrefs) {
    this.prefs.update(p => ({ ...p, [key]: !p[key] }));
    await this.auth.updateProfile({ notification_prefs: this.prefs() });
  }

  async requestPush() {
    const granted = await this.notificationsService.requestPushPermission();
    if (granted) {
      this.notificationsService.showPushNotification(
        'PadelHub',
        '¡Notificaciones activadas correctamente!'
      );
    }
  }
}
