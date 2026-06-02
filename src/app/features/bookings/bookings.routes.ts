import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const BOOKINGS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bookings-list/bookings-list.component').then((m) => m.BookingsListComponent),
  },
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./booking-new/booking-new.component').then((m) => m.BookingNewComponent),
  },
  {
    path: ':id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./booking-detail/booking-detail.component').then((m) => m.BookingDetailComponent),
  },
];
