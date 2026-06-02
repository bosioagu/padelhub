import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  // Auth routes (no shell)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // App routes (inside shell)
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'courts',
        loadComponent: () =>
          import('./features/courts/courts.component').then((m) => m.CourtsComponent),
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('./features/bookings/bookings.routes').then((m) => m.BOOKINGS_ROUTES),
      },
      {
        path: 'match-results',
        loadComponent: () =>
          import('./features/match-results/match-results.component').then(
            (m) => m.MatchResultsComponent
          ),
      },
      {
        path: 'academy',
        loadComponent: () =>
          import('./features/academy/academy.component').then((m) => m.AcademyComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      // Default redirect → court availability (public)
      { path: '', redirectTo: 'courts', pathMatch: 'full' },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'courts' },
];
