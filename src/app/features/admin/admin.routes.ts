import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'courts',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-courts/admin-courts.component').then((m) => m.AdminCourtsComponent),
  },
  {
    path: 'players',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-players/admin-players.component').then((m) => m.AdminPlayersComponent),
  },
  {
    path: 'notifications',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-notifications/admin-notifications.component').then(
        (m) => m.AdminNotificationsComponent
      ),
  },
  {
    path: 'academy',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-academy/admin-academy.component').then((m) => m.AdminAcademyComponent),
  },
];
