import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationLog } from '../../../core/models/database.types';
import { environment } from '../../../../environments/environment';
import { MOCK_NOTIFICATIONS } from '../../../core/services/mock-data';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Log de notificaciones</h1>
        <span class="text-sm text-gray-500">{{ logs().length }} registros</span>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (logs().length === 0) {
        <div class="text-center py-20">
          <span class="material-icons-round text-5xl text-gray-300">notifications_none</span>
          <p class="text-gray-500 mt-3">Sin notificaciones registradas</p>
        </div>
      } @else {
        <div class="card overflow-hidden p-0">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Usuario</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enviado</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (log of logs(); track log.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="material-icons-round text-gray-400 text-base">{{ typeIcon(log.type) }}</span>
                      <span class="text-sm text-gray-700">{{ typeLabel(log.type) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span class="text-xs text-gray-500">{{ log.user_id.slice(0, 8) }}…</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-sm text-gray-600">{{ log.sent_at | date:'dd/MM HH:mm' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                      [class.bg-green-100]="log.status === 'sent'"
                      [class.text-green-700]="log.status === 'sent'"
                      [class.bg-red-100]="log.status === 'failed'"
                      [class.text-red-600]="log.status === 'failed'"
                      [class.bg-yellow-100]="log.status === 'pending'"
                      [class.text-yellow-600]="log.status === 'pending'"
                    >
                      {{ log.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminNotificationsComponent implements OnInit {
  private sb = inject(SupabaseService);

  logs = signal<NotificationLog[]>([]);
  loading = signal(true);

  typeLabel = (t: string): string => ({
    email_reminder_24h: 'Recordatorio 24h',
    push_1h: 'Push 1h antes',
    booking_confirmation: 'Confirmación de reserva',
    match_prompt: 'Prompt resultado',
  }[t] ?? t);

  typeIcon = (t: string): string => ({
    email_reminder_24h: 'mail',
    push_1h: 'notifications',
    booking_confirmation: 'event',
    match_prompt: 'emoji_events',
  }[t] ?? 'notifications');

  async ngOnInit() {
    try {
      if (environment.useMock) {
        this.logs.set([...MOCK_NOTIFICATIONS]);
        return;
      }
      const { data } = await this.sb.client
        .from('notifications_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      this.logs.set((data as NotificationLog[]) ?? []);
    } finally {
      this.loading.set(false);
    }
  }
}
