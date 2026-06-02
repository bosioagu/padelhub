import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationLog } from '../../core/models/database.types';

export interface InAppNotification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

/**
 * Handles in-app notifications via Supabase Realtime.
 * Subscribe to the notifications_log table for real-time updates.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);

  /** In-memory list of unread notifications */
  readonly notifications = signal<InAppNotification[]>([]);
  readonly unreadCount = () => this.notifications().filter(n => !n.read).length;

  private channel: ReturnType<typeof this.sb.client.channel> | null = null;

  /** Call this once the user is authenticated to start listening */
  startListening() {
    const profile = this.auth.profile();
    if (!profile) return;

    this.channel = this.sb.client
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_log',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const log = payload.new as NotificationLog;
          const notification: InAppNotification = {
            id: log.id,
            message: this.messageFor(log.type),
            type: log.type,
            read: false,
            created_at: log.sent_at,
          };
          this.notifications.update(list => [notification, ...list].slice(0, 20));
        }
      )
      .subscribe();
  }

  stopListening() {
    if (this.channel) {
      this.sb.client.removeChannel(this.channel);
      this.channel = null;
    }
  }

  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  /** Request browser push notification permission */
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  /** Show a browser push notification */
  showPushNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      });
    }
  }

  private messageFor(type: string): string {
    const messages: Record<string, string> = {
      email_reminder_24h: 'Recordatorio: tenés una reserva mañana',
      push_1h: 'Tu reserva es en 1 hora',
      booking_confirmation: 'Tu reserva fue confirmada',
      match_prompt: '¿Cómo te fue? Registrá el resultado de tu partido',
    };
    return messages[type] ?? 'Nueva notificación';
  }
}
