import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { NotificationsService } from './features/notifications/notifications.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private notifications = inject(NotificationsService);

  ngOnInit() {
    // Start listening for push notifications once authenticated
    if (this.auth.isAuthenticated()) {
      this.notifications.startListening();
    }
  }

  ngOnDestroy() {
    this.notifications.stopListening();
  }
}
