import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingsService } from '../bookings.service';
import { CourtsService } from '../../courts/courts.service';
import { Court, BookingPlayer } from '../../../core/models/database.types';

@Component({
  selector: 'app-booking-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button (click)="goBack()" class="p-2 rounded-lg hover:bg-gray-100">
          <span class="material-icons-round text-gray-600">arrow_back</span>
        </button>
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Nueva reserva</h1>
      </div>

      @if (success()) {
        <div class="card text-center py-10">
          <div class="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-icons-round text-[var(--color-primary)] text-3xl">check</span>
          </div>
          <h2 class="text-xl font-bold text-[var(--color-primary)] mb-2">¡Reserva confirmada!</h2>
          <p class="text-gray-500 text-sm mb-6">Recibirás un recordatorio por email 24hs antes.</p>
          <button (click)="goBack()"
            class="bg-[var(--color-primary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">
            Ver mis reservas
          </button>
        </div>
      } @else {
        <div class="card">
          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {{ error() }}
            </div>
          }

          <!-- Court -->
          <div class="mb-5">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Cancha</label>
            <div class="grid grid-cols-2 gap-2">
              @for (court of courts(); track court.id) {
                <button type="button"
                  (click)="selectedCourtId.set(court.id)"
                  class="p-3 rounded-xl border-2 text-left transition-all"
                  [ngClass]="selectedCourtId() === court.id ? 'court-card-selected' : 'border-gray-200'"
                >
                  <div class="flex items-center gap-2">
                    <span class="material-icons-round text-lg text-gray-500">
                      {{ court.is_indoor ? 'home' : 'wb_sunny' }}
                    </span>
                    <div>
                      <p class="text-sm font-semibold text-gray-800">{{ court.name }}</p>
                      <p class="text-xs text-gray-400">{{ court.surface }} · {{ court.is_indoor ? 'Techada' : 'Descubierta' }}</p>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Date & Time -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input type="date" [(ngModel)]="selectedDate"
                [min]="minDate"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Horario</label>
              <select [(ngModel)]="selectedTime"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                @for (t of timeOptions; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Duration -->
          <div class="mb-5">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Duración</label>
            <div class="flex gap-3">
              @for (dur of durations; track dur.value) {
                <button type="button"
                  (click)="selectedDuration.set(dur.value)"
                  class="flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  [ngClass]="selectedDuration() === dur.value ? 'chip-selected' : 'chip-unselected'"
                >
                  {{ dur.label }}
                </button>
              }
            </div>
          </div>

          <!-- Additional players -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-semibold text-gray-700">Jugadores adicionales</label>
              @if (additionalPlayers().length < 3) {
                <button type="button" (click)="addPlayer()"
                  class="text-xs text-[var(--color-primary)] font-semibold hover:underline">
                  + Agregar
                </button>
              }
            </div>

            @for (player of additionalPlayers(); track $index) {
              <div class="flex gap-2 mb-2">
                <input type="text" [(ngModel)]="player.name"
                  placeholder="Nombre"
                  class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <input type="email" [(ngModel)]="player.email"
                  placeholder="Email (opcional)"
                  class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button type="button" (click)="removePlayer($index)"
                  class="p-2 text-red-400 hover:text-red-600">
                  <span class="material-icons-round text-base">close</span>
                </button>
              </div>
            }
          </div>

          <button (click)="onSubmit()" [disabled]="submitting()"
            class="w-full bg-[var(--color-accent)] text-[var(--color-primary)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            @if (submitting()) { Reservando... } @else { Confirmar reserva }
          </button>
        </div>
      }
    </div>
  `,
})
export class BookingNewComponent implements OnInit {
  private bookingsService = inject(BookingsService);
  private courtsService = inject(CourtsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  courts = signal<Court[]>([]);
  selectedCourtId = signal<string>('');
  selectedDate = '';
  selectedTime = '09:00';
  selectedDuration = signal<60 | 90>(90);
  additionalPlayers = signal<BookingPlayer[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  readonly minDate = new Date().toISOString().split('T')[0];

  readonly timeOptions = [
    '07:00', '08:30', '10:00', '11:30', '13:00',
    '14:30', '16:00', '17:30', '19:00', '20:30',
  ];

  readonly durations: { value: 60 | 90; label: string }[] = [
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
  ];

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const courtId = params.get('courtId');
    const date    = params.get('date');
    const time    = params.get('time');

    const courts = await this.courtsService.getCourts();
    this.courts.set(courts);

    if (courtId) this.selectedCourtId.set(courtId);
    else if (courts.length > 0) this.selectedCourtId.set(courts[0].id);

    if (date) this.selectedDate = date;
    else this.selectedDate = this.minDate;

    if (time) this.selectedTime = time;
  }

  addPlayer() {
    this.additionalPlayers.update(list => [...list, { name: '', email: '' }]);
  }

  removePlayer(index: number) {
    this.additionalPlayers.update(list => list.filter((_, i) => i !== index));
  }

  async onSubmit() {
    if (!this.selectedCourtId() || !this.selectedDate || !this.selectedTime) {
      this.error.set('Completá todos los campos requeridos.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const [h, m] = this.selectedTime.split(':').map(Number);
      const start = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
      const end   = new Date(start.getTime() + this.selectedDuration() * 60_000);

      await this.bookingsService.createBooking({
        court_id:    this.selectedCourtId(),
        start_time:  start.toISOString(),
        end_time:    end.toISOString(),
        players_json: this.additionalPlayers().filter(p => p.name.trim()),
      });

      this.success.set(true);
    } catch (err: unknown) {
      this.error.set((err as Error).message ?? 'Error al crear la reserva.');
    } finally {
      this.submitting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/bookings']);
  }
}
