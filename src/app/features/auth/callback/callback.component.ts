import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/** Handles OAuth callback redirects from Supabase */
@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-primary)]">
      <div class="text-center">
        <div class="inline-block w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-white/70 text-sm">Verificando sesión...</p>
      </div>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Supabase detects the session from the URL hash automatically.
    // Wait a tick for AuthService to process onAuthStateChange.
    setTimeout(() => {
      if (!this.auth.profile()) {
        this.router.navigate(['/auth/profile-setup']);
      } else {
        const isAdmin = this.auth.isAdmin();
        this.router.navigate(isAdmin ? ['/admin'] : ['/courts']);
      }
    }, 1500);
  }
}
