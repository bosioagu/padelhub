import { Routes } from '@angular/router';
import { noAuthGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'profile-setup',
    loadComponent: () =>
      import('./profile-setup/profile-setup.component').then(
        (m) => m.ProfileSetupComponent
      ),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./callback/callback.component').then((m) => m.CallbackComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
