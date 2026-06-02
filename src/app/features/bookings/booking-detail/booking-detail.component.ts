import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingsService } from '../bookings.service';
import { Booking } from '../../../core/models/database.types';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button (click)="router.navigate(['/bookings'])" class="p-2 rounded-lg hover:bg-gray-100">
          <span class="material-icons-round text-gray-600">arrow_back</span>
        </button>
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Detalle de reserva</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (booking()) {
        <div class="card">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-[var(--color-primary)]">{{ booking()!.court?.name }}</h2>
              <p class="text-gray-500 text-sm">{{ booking()!.court?.surface }} · {{ booking()!.court?.is_indoor ? 'Techada' : 'Descubierta' }}</p>
            </div>
            <span class="text-xs font-bold px-3 py-1 rounded-full"
              [class.bg-green-100]="booking()!.status === 'confirmed'"
              [class.text-green-700]="booking()!.status === 'confirmed'"
              [class.bg-red-100]="booking()!.status === 'cancelled'"
              [class.text-red-600]="booking()!.status === 'cancelled'"
              [class.bg-gray-100]="booking()!.status === 'completed'"
              [class.text-gray-600]="booking()!.status === 'completed'"
            >
              {{ booking()!.status === 'confirmed' ? 'Confirmada' : booking()!.status === 'cancelled' ? 'Cancelada' : 'Completada' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-1">Fecha</p>
              <p class="font-semibold text-gray-800">{{ booking()!.start_time | date:'dd/MM/yyyy' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-1">Horario</p>
              <p class="font-semibold text-gray-800">
                {{ booking()!.start_time | date:'HH:mm' }} – {{ booking()!.end_time | date:'HH:mm' }}
              </p>
            </div>
          </div>

          @if (booking()!.players_json.length) {
            <div class="mb-6">
              <p class="text-sm font-semibold text-gray-700 mb-2">Jugadores</p>
              <div class="space-y-2">
                @for (p of booking()!.players_json; track p.email) {
                  <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span class="material-icons-round text-gray-400 text-base">person</span>
                    <span class="text-sm text-gray-700">{{ p.name }}</span>
                    @if (p.email) {
                      <span class="text-xs text-gray-400">{{ p.email }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (booking()!.status === 'confirmed') {
            <button (click)="cancel()" [disabled]="cancelling()"
              class="w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
              @if (cancelling()) { Cancelando... } @else { Cancelar reserva }
            </button>
          }
        </div>
      } @else {
        <p class="text-center text-gray-500 py-20">Reserva no encontrada.</p>
      }
    </div>
  `,
})
export class BookingDetailComponent implements OnInit {
  private service = inject(BookingsService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  booking = signal<Booking | null>(null);
  loading = signal(true);
  cancelling = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      this.booking.set(await this.service.getBooking(id));
    } finally {
      this.loading.set(false);
    }
  }

  async cancel() {
    if (!confirm('¿Cancelar esta reserva?')) return;
    this.cancelling.set(true);
    await this.service.cancelBooking(this.booking()!.id);
    this.booking.update(b => b ? { ...b, status: 'cancelled' } : b);
    this.cancelling.set(false);
  }
}
