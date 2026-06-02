import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Profile } from '../../../core/models/database.types';
import { environment } from '../../../../environments/environment';
import { MOCK_PLAYERS } from '../../../core/services/mock-data';

@Component({
  selector: 'app-admin-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Jugadores registrados</h1>
        <span class="text-sm text-gray-500">{{ filtered().length }} jugadores</span>
      </div>

      <!-- Search -->
      <div class="relative mb-4">
        <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
        <input type="text" [(ngModel)]="search"
          placeholder="Buscar por nombre o email..."
          class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else {
        <div class="card overflow-hidden p-0">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jugador</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Nivel</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Teléfono</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (p of filtered(); track p.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {{ p.full_name.slice(0,2).toUpperCase() }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ p.full_name }}</p>
                        <p class="text-xs text-gray-400">Desde {{ p.created_at | date:'MM/yyyy' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span class="text-xs">{{ levelEmoji(p.level) }} {{ levelLabel(p.level) }}</span>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span class="text-sm text-gray-600">{{ p.phone ?? '—' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [ngClass]="p.role === 'admin' ? 'badge-admin' : 'bg-gray-100 text-gray-600'">
                      {{ p.role === 'admin' ? 'Admin' : 'Jugador' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filtered().length === 0) {
            <p class="text-center text-gray-400 text-sm py-8">No se encontraron jugadores</p>
          }
        </div>
      }
    </div>
  `,
})
export class AdminPlayersComponent implements OnInit {
  private sb = inject(SupabaseService);

  players = signal<Profile[]>([]);
  loading = signal(true);
  search = '';

  filtered = () => {
    const q = this.search.toLowerCase();
    if (!q) return this.players();
    return this.players().filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q)
    );
  };

  levelLabel = (l: string) => ({ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[l] ?? l);
  levelEmoji = (l: string) => ({ beginner: '🌱', intermediate: '⚡', advanced: '🔥' }[l] ?? '');

  async ngOnInit() {
    try {
      if (environment.useMock) {
        this.players.set([...MOCK_PLAYERS]);
        return;
      }
      const { data } = await this.sb.client
        .from('profiles')
        .select('*')
        .order('full_name');
      this.players.set((data as Profile[]) ?? []);
    } finally {
      this.loading.set(false);
    }
  }
}
