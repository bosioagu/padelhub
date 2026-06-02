import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TopNavComponent } from '../nav/top-nav.component';
import { SidebarComponent } from '../nav/sidebar.component';
import { BottomNavComponent } from '../nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopNavComponent, SidebarComponent, BottomNavComponent],
  template: `
    <div class="flex min-h-screen bg-[var(--color-surface)]">
      <!-- Sidebar (desktop) -->
      @if (isAuthenticated()) {
        <app-sidebar class="hidden md:flex" />
      }

      <!-- Main area -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-top-nav />

        <main class="flex-1 main-content route-anim p-4 md:p-6">
          <router-outlet />
        </main>
      </div>

      <!-- Bottom nav (mobile, players only) -->
      @if (isAuthenticated() && !isAdmin()) {
        <app-bottom-nav />
      }
    </div>
  `,
})
export class ShellComponent {
  private auth = inject(AuthService);

  isAuthenticated = this.auth.isAuthenticated;
  isAdmin = this.auth.isAdmin;
}
