import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CourtsService } from './courts.service';
import { AuthService } from '../../core/auth/auth.service';
import { Court, Booking, WeekDay } from '../../core/models/database.types';

/** Time slots offered (07:00 – 22:00 in 90-min blocks) */
const TIME_SLOTS = [
  '07:00', '08:30', '10:00', '11:30', '13:00',
  '14:30', '16:00', '17:30', '19:00', '20:30',
];

interface SlotInfo {
  available: boolean;
  isBlocked: boolean;
  isMyBooking: boolean;
  booking?: Booking;
}

@Component({
  selector: 'app-courts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">

      <!-- Header (padding reducido de mb-6 a mb-4) -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-[var(--color-primary)]">Disponibilidad de canchas</h1>
          <p class="text-sm text-gray-500 mt-0.5">Seleccioná una cancha y horario para reservar</p>
        </div>

        @if (!isAuthenticated()) {
          <a routerLink="/auth/login"
            class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg">
            Reservar
          </a>
        }
      </div>

      <!-- Week navigation -->
      <div class="flex items-center gap-4 mb-3">
        <button (click)="prevWeek()"
          class="p-2 rounded-lg border border-gray-200 hover:border-[var(--color-primary)] transition-colors">
          <span class="material-icons-round text-gray-600">chevron_left</span>
        </button>

        <span class="flex-1 text-center font-semibold text-[var(--color-primary)]">
          {{ weekLabel() }}
        </span>

        <button (click)="nextWeek()"
          class="p-2 rounded-lg border border-gray-200 hover:border-[var(--color-primary)] transition-colors">
          <span class="material-icons-round text-gray-600">chevron_right</span>
        </button>

        <button (click)="goToday()"
          class="text-sm font-medium text-[var(--color-primary)] px-3 py-2 rounded-lg border border-gray-200 hover:bg-[var(--color-primary)] hover:text-white transition-all">
          Hoy
        </button>
      </div>

      <!-- Court selector chips -->
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        @for (court of courts(); track court.id) {
          <button
            (click)="selectedCourt.set(court)"
            class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all"
            [ngClass]="selectedCourt()?.id === court.id ? 'chip-selected' : 'chip-unselected'"
          >
            <span class="material-icons-round align-middle text-base mr-1">
              {{ court.is_indoor ? 'home' : 'wb_sunny' }}
            </span>
            {{ court.name }}
          </button>
        }
      </div>

      <!-- ── Leyenda de estados ── -->
      <div class="flex gap-2 flex-wrap mb-3">
        <!-- Disponible -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <div class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
          <span class="text-xs text-emerald-700 font-medium">Disponible</span>
        </div>
        <!-- Bloqueado -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200">
          <div class="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></div>
          <span class="text-xs text-gray-500 font-medium">Bloqueado</span>
        </div>
        <!-- Mi reserva -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary)] border border-[var(--color-primary)]">
          <div class="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0"></div>
          <span class="text-xs text-white font-medium">Mi reserva</span>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else {

        <!-- ── Grilla con wrapper de scroll ── -->
        <!--
          La capa exterior (.relative.rounded-2xl.overflow-hidden) sirve de marco
          para el degradado de fade-right posicionado absolutamente.
          La capa interior tiene overflow-x-auto y un min-width que fuerza
          el scroll en pantallas ≤ 383 px, dejando SAB/DOM parcialmente visibles.
        -->
        <div class="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">

          <!-- Contenedor scrollable -->
          <div class="overflow-x-auto" (scroll)="onGridScroll($event)">
            <!-- min-width fuerza overflow: 80px + 7 × 58px = 486px > 383px -->
            <div style="min-width: 486px">
              <div class="bg-white">

                <!-- Encabezado de días -->
                <!-- sticky no funciona dentro de overflow-x-auto, se omite -->
                <div class="grid bg-white border-b border-gray-100"
                     [style.gridTemplateColumns]="'72px repeat(' + weekDays().length + ', 1fr)'">
                  <div class="p-3 text-xs text-gray-400 font-medium">Hora</div>
                  @for (day of weekDays(); track day.date.toISOString()) {
                    <div class="p-2 text-center transition-colors"
                         [style.background]="day.isToday ? 'var(--color-accent)' : 'transparent'">
                      <!-- Texto primario ya es verde oscuro sobre lima → contraste ~12:1, pasa WCAG AAA -->
                      <div class="text-[10px] font-semibold uppercase tracking-wide"
                           [class.text-gray-400]="!day.isToday"
                           [style.color]="day.isToday ? 'var(--color-primary)' : ''">
                        {{ day.label.split(' ')[0] }}
                      </div>
                      <div class="text-base font-bold leading-tight"
                           [style.color]="day.isToday ? 'var(--color-primary)' : '#374151'">
                        {{ day.label.split(' ')[1] }}
                      </div>
                    </div>
                  }
                </div>

                <!-- Filas de horarios -->
                @for (time of timeSlots; track time) {
                  <div class="grid border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
                       [style.gridTemplateColumns]="'72px repeat(' + weekDays().length + ', 1fr)'">

                    <!-- Etiqueta de hora -->
                    <div class="px-2 py-2 text-[10px] text-gray-400 font-medium flex items-center">{{ time }}</div>

                    @for (day of weekDays(); track day.date.toISOString()) {
                      @let slot = getSlot(day, time);
                      <div class="p-0.5">

                        @if (slot.isMyBooking) {
                          <!-- Estado: Mi reserva → verde oscuro + texto blanco -->
                          <div class="rounded-md py-2 px-0.5 text-center font-bold bg-[var(--color-primary)] text-white"
                               style="font-size: 8px; line-height: 1.3">
                            Mi<br>reserva
                          </div>

                        } @else if (slot.isBlocked) {
                          <!-- Estado: Bloqueado → gris claro, pasado o cerrado -->
                          <div class="rounded-md py-2 bg-gray-100 text-center text-gray-300 select-none"
                               style="font-size: 14px; line-height: 1">
                            —
                          </div>

                        } @else if (!slot.available) {
                          <!-- Estado: Ocupado por otro jugador -->
                          <div class="rounded-md py-2 text-center bg-red-50 text-red-400"
                               style="font-size: 8px; line-height: 1.3; font-weight: 600">
                            Ocup.
                          </div>

                        } @else {
                          <!-- Estado: Disponible → verde claro + acción -->
                          <button
                            (click)="onSlotClick(day, time)"
                            class="w-full rounded-md py-2 text-center font-semibold bg-emerald-50 text-emerald-700 hover:bg-[var(--color-accent)] hover:text-[var(--color-primary)] transition-all border border-emerald-200 hover:border-[var(--color-accent)]"
                            style="font-size: 8px; line-height: 1.3"
                          >
                            Libre
                          </button>
                        }

                      </div>
                    }
                  </div>
                }

              </div>
            </div>
          </div>

          <!-- ── Degradado fade-right (indicador de scroll) ── -->
          @if (showScrollHint()) {
            <!-- Capa semitransparente que cubre el borde derecho -->
            <div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent pointer-events-none z-10"></div>

            <!-- Pill "deslizá →" -->
            <div class="absolute bottom-2 right-1.5 flex items-center gap-0.5 pointer-events-none z-20
                        bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full
                        border border-gray-200 shadow-sm text-gray-500"
                 style="font-size: 9px">
              deslizá
              <span class="material-icons-round" style="font-size: 10px; line-height: 1">arrow_forward</span>
            </div>
          }

        </div>
        <!-- /grid wrapper -->

      }
    </div>
  `,
})
export class CourtsComponent implements OnInit {
  private courtsService = inject(CourtsService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly timeSlots = TIME_SLOTS;

  courts = signal<Court[]>([]);
  selectedCourt = signal<Court | null>(null);
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  /** Oculta el hint de scroll una vez que el usuario llegó al final */
  showScrollHint = signal(true);

  private weekOffset = signal(0);

  isAuthenticated = this.auth.isAuthenticated;
  /** ID del perfil del usuario logueado (para detectar "Mi reserva") */
  currentProfileId = computed(() => this.auth.profile()?.id ?? null);

  weekDays = computed<WeekDay[]>(() => {
    const today = new Date();
    const offset = this.weekOffset();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diff + offset * 7);

    const days: WeekDay[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        date: d,
        label: `${dayNames[d.getDay()]} ${d.getDate()}`,
        isToday,
      });
    }
    return days;
  });

  weekLabel = computed(() => {
    const days = this.weekDays();
    const first = days[0].date;
    const last = days[6].date;
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${first.getDate()} ${months[first.getMonth()]} — ${last.getDate()} ${months[last.getMonth()]} ${last.getFullYear()}`;
  });

  async ngOnInit() {
    await this.loadCourts();
  }

  private async loadCourts() {
    this.loading.set(true);
    try {
      const courts = await this.courtsService.getCourts();
      this.courts.set(courts);
      if (courts.length > 0) {
        this.selectedCourt.set(courts[0]);
        await this.loadBookings();
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBookings() {
    const days = this.weekDays();
    const from = days[0].date.toISOString().split('T')[0] + 'T00:00:00Z';
    const to = days[6].date.toISOString().split('T')[0] + 'T23:59:59Z';
    const data = await this.courtsService.getBookingsForRange(from, to);
    this.bookings.set(data);
  }

  /** Retorna el estado de una celda horario × día */
  getSlot(day: WeekDay, time: string): SlotInfo {
    const court = this.selectedCourt();
    if (!court) return { available: true, isBlocked: false, isMyBooking: false };

    const [h, m] = time.split(':').map(Number);
    const slotStart = new Date(day.date);
    slotStart.setHours(h, m, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 90);

    // Slots pasados → bloqueados
    if (slotStart < new Date()) {
      return { available: false, isBlocked: true, isMyBooking: false };
    }

    const booking = this.bookings().find(b => {
      if (b.court_id !== court.id) return false;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return bStart < slotEnd && bEnd > slotStart;
    });

    const isMyBooking = !!booking && booking.player_id === this.currentProfileId();

    return { available: !booking, isBlocked: false, isMyBooking, booking };
  }

  /** Oculta el pill "deslizá" cuando el usuario llegó al extremo derecho */
  onGridScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    this.showScrollHint.set(!atEnd);
  }

  onSlotClick(day: WeekDay, time: string) {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const court = this.selectedCourt();
    if (!court) return;

    const dateStr = day.date.toISOString().split('T')[0];
    this.router.navigate(['/bookings/new'], {
      queryParams: { courtId: court.id, date: dateStr, time },
    });
  }

  prevWeek() {
    this.weekOffset.update(v => v - 1);
    this.loadBookings();
  }

  nextWeek() {
    this.weekOffset.update(v => v + 1);
    this.loadBookings();
  }

  goToday() {
    this.weekOffset.set(0);
    this.loadBookings();
  }
}
