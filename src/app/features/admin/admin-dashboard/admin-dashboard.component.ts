import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Booking, AcademyClass, Profile } from '../../../core/models/database.types';
import { environment } from '../../../../environments/environment';

interface DashboardStats {
  todayBookings: number;
  totalCourts: number;
  activePlayers: number;
  activeClasses: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Panel de administración</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ today | date:'dd/MM/yyyy' }}</p>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-400 uppercase">Reservas hoy</span>
            <span class="material-icons-round text-[var(--color-primary)] text-xl">event</span>
          </div>
          <p class="text-3xl font-black text-[var(--color-primary)]">{{ stats().todayBookings }}</p>
        </div>
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-400 uppercase">Canchas</span>
            <span class="material-icons-round text-[var(--color-primary)] text-xl">sports_tennis</span>
          </div>
          <p class="text-3xl font-black text-[var(--color-primary)]">{{ stats().totalCourts }}</p>
        </div>
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-400 uppercase">Jugadores</span>
            <span class="material-icons-round text-[var(--color-primary)] text-xl">people</span>
          </div>
          <p class="text-3xl font-black text-[var(--color-primary)]">{{ stats().activePlayers }}</p>
        </div>
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-400 uppercase">Clases activas</span>
            <span class="material-icons-round text-[var(--color-primary)] text-xl">school</span>
          </div>
          <p class="text-3xl font-black text-[var(--color-primary)]">{{ stats().activeClasses }}</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- Today's bookings -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-gray-800">Reservas de hoy</h2>
            <a routerLink="/admin/courts" class="text-xs text-[var(--color-primary)] font-semibold hover:underline">Ver calendario →</a>
          </div>

          @if (loading()) {
            <div class="py-8 flex justify-center">
              <div class="w-6 h-6 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (todayBookings().length === 0) {
            <p class="text-sm text-gray-400 text-center py-8">Sin reservas para hoy</p>
          } @else {
            <div class="space-y-2">
              @for (b of todayBookings(); track b.id) {
                <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-icons-round text-[var(--color-primary)] text-sm">person</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ b.player?.full_name ?? 'Jugador' }}</p>
                    <p class="text-xs text-gray-400">{{ b.court?.name }} · {{ b.start_time | date:'HH:mm' }}–{{ b.end_time | date:'HH:mm' }}</p>
                  </div>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Admin shortcuts -->
        <div class="card">
          <h2 class="font-bold text-gray-800 mb-4">Accesos rápidos</h2>
          <div class="grid grid-cols-2 gap-3">
            @for (item of shortcuts; track item.label) {
              <a [routerLink]="item.route"
                class="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)] border border-transparent transition-all text-center gap-2">
                <span class="material-icons-round text-[var(--color-primary)] text-2xl">{{ item.icon }}</span>
                <span class="text-xs font-semibold text-gray-700">{{ item.label }}</span>
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Utilization by court (simple) -->
      @if (!loading() && courtUtilization().length > 0) {
        <div class="card">
          <h2 class="font-bold text-gray-800 mb-4">Utilización de canchas (hoy)</h2>
          <div class="space-y-3">
            @for (u of courtUtilization(); track u.courtName) {
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700">{{ u.courtName }}</span>
                  <span class="font-semibold text-gray-600">{{ u.pct }}%</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all"
                    [style.width.%]="u.pct"
                    [ngClass]="u.pct < 80 ? 'bar-accent' : 'bar-warning'">
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private sb = inject(SupabaseService);

  loading = signal(true);
  todayBookings = signal<Booking[]>([]);

  today = new Date();

  stats = signal<DashboardStats>({
    todayBookings: 0,
    totalCourts: 0,
    activePlayers: 0,
    activeClasses: 0,
  });

  courtUtilization = signal<{ courtName: string; pct: number }[]>([]);

  readonly shortcuts = [
    { label: 'Gestionar canchas', icon: 'sports_tennis', route: '/admin/courts' },
    { label: 'Jugadores', icon: 'people', route: '/admin/players' },
    { label: 'Academia', icon: 'school', route: '/admin/academy' },
    { label: 'Notificaciones', icon: 'notifications', route: '/admin/notifications' },
  ];

  async ngOnInit() {
    await Promise.all([
      this.loadTodayBookings(),
      this.loadStats(),
    ]);
    this.loading.set(false);
  }

  private async loadTodayBookings() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let bookings: Booking[];

    if (environment.useMock) {
      const { MOCK_BOOKINGS } = await import('../../../core/services/mock-data');
      bookings = MOCK_BOOKINGS.filter(b => {
        const s = new Date(b.start_time);
        return s >= start && s <= end && b.status === 'confirmed';
      }).map(b => ({ ...b, player: { full_name: 'Jugador Demo' } as Profile }));
    } else {
      const { data } = await this.sb.client
        .from('bookings')
        .select('*, court:courts(name), player:profiles(full_name)')
        .eq('status', 'confirmed')
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .order('start_time');
      bookings = (data as Booking[]) ?? [];
    }

    this.todayBookings.set(bookings);

    // Build utilization
    const courtMap: Record<string, number> = {};
    const TOTAL_SLOTS = 10; // 10 slots per day
    for (const b of bookings) {
      const name = b.court?.name ?? 'Unknown';
      courtMap[name] = (courtMap[name] ?? 0) + 1;
    }
    this.courtUtilization.set(
      Object.entries(courtMap).map(([courtName, count]) => ({
        courtName,
        pct: Math.min(100, Math.round((count / TOTAL_SLOTS) * 100)),
      }))
    );
  }

  private async loadStats() {
    if (environment.useMock) {
      const { MOCK_COURTS, MOCK_PLAYERS, MOCK_CLASSES } = await import('../../../core/services/mock-data');
      this.stats.set({
        todayBookings: this.todayBookings().length,
        totalCourts: MOCK_COURTS.filter(c => c.is_active).length,
        activePlayers: MOCK_PLAYERS.filter(p => p.role === 'player').length,
        activeClasses: MOCK_CLASSES.filter(c => c.is_active).length,
      });
      return;
    }

    const [courts, players, classes] = await Promise.all([
      this.sb.client.from('courts').select('id', { count: 'exact' }).eq('is_active', true),
      this.sb.client.from('profiles').select('id', { count: 'exact' }).eq('role', 'player'),
      this.sb.client.from('classes').select('id', { count: 'exact' }).eq('is_active', true),
    ]);

    this.stats.update(s => ({
      ...s,
      todayBookings: this.todayBookings().length,
      totalCourts: courts.count ?? 0,
      activePlayers: players.count ?? 0,
      activeClasses: classes.count ?? 0,
    }));
  }
}
