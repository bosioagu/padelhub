import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingsService } from '../bookings.service';
import { Booking } from '../../../core/models/database.types';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Mis reservas</h1>
        <a routerLink="/courts"
          class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90">
          + Nueva reserva
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (bookings().length === 0) {
        <div class="text-center py-20">
          <span class="material-icons-round text-5xl text-gray-300">event_busy</span>
          <p class="text-gray-500 mt-3">Todavía no tenés reservas</p>
          <a routerLink="/courts" class="mt-4 inline-block text-[var(--color-primary)] font-semibold hover:underline">
            Reservar una cancha →
          </a>
        </div>
      } @else {
        <!-- Upcoming -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Próximas</h2>
          <div class="space-y-3">
            @for (b of upcoming(); track b.id) {
              <div class="card flex items-center gap-4">
                <div class="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span class="text-[var(--color-primary)] font-bold text-sm">{{ b.start_time | date:'d' }}</span>
                  <span class="text-[var(--color-primary)] text-xs uppercase">{{ b.start_time | date:'MMM' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 truncate">{{ b.court?.name ?? 'Cancha' }}</p>
                  <p class="text-sm text-gray-500">
                    {{ b.start_time | date:'HH:mm' }} – {{ b.end_time | date:'HH:mm' }}
                    · {{ b.court?.is_indoor ? 'Techada' : 'Descubierta' }}
                  </p>
                  @if (b.players_json.length) {
                    <p class="text-xs text-gray-400 mt-0.5">
                      Con: {{ b.players_json.map(p => p.name).join(', ') }}
                    </p>
                  }
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Confirmada
                  </span>
                  <button (click)="cancelBooking(b)"
                    class="text-xs text-red-500 hover:underline">Cancelar</button>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Past -->
        @if (past().length > 0) {
          <section>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Historial</h2>
            <div class="space-y-2">
              @for (b of past(); track b.id) {
                <div class="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3 opacity-70">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-700 text-sm truncate">{{ b.court?.name }}</p>
                    <p class="text-xs text-gray-400">{{ b.start_time | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class.bg-gray-100]="b.status === 'completed'"
                    [class.text-gray-500]="b.status === 'completed'"
                    [class.bg-red-100]="b.status === 'cancelled'"
                    [class.text-red-500]="b.status === 'cancelled'">
                    {{ b.status === 'cancelled' ? 'Cancelada' : 'Completada' }}
                  </span>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class BookingsListComponent implements OnInit {
  private service = inject(BookingsService);

  bookings = signal<Booking[]>([]);
  loading = signal(true);

  upcoming = () => {
    const now = new Date();
    return this.bookings().filter(
      b => b.status === 'confirmed' && new Date(b.start_time) > now
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  past = () =>
    this.bookings().filter(b => b.status !== 'confirmed' || new Date(b.start_time) <= new Date());

  async ngOnInit() {
    try {
      const data = await this.service.getMyBookings();
      this.bookings.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async cancelBooking(booking: Booking) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await this.service.cancelBooking(booking.id);
    this.bookings.update(list =>
      list.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b)
    );
  }
}
