import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Booking, BookingPlayer, BookingStatus } from '../../core/models/database.types';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';
import { MOCK_MY_BOOKINGS, MOCK_COURTS } from '../../core/services/mock-data';

export interface CreateBookingDto {
  court_id: string;
  start_time: string;
  end_time: string;
  players_json: BookingPlayer[];
}

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);

  async getMyBookings(): Promise<Booking[]> {
    if (environment.useMock) return [...MOCK_MY_BOOKINGS];

    const profileId = this.auth.profile()?.id;
    if (!profileId) return [];

    const { data, error } = await this.sb.client
      .from('bookings')
      .select('*, court:courts(*)')
      .eq('player_id', profileId)
      .order('start_time', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data as Booking[]) ?? [];
  }

  async getAllBookings(from?: string, to?: string): Promise<Booking[]> {
    if (environment.useMock) return [...MOCK_MY_BOOKINGS];

    let query = this.sb.client
      .from('bookings')
      .select('*, court:courts(*), player:profiles(full_name, phone)')
      .order('start_time', { ascending: false });
    if (from) query = query.gte('start_time', from);
    if (to)   query = query.lte('end_time', to);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Booking[]) ?? [];
  }

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    if (environment.useMock) {
      const court = MOCK_COURTS.find(c => c.id === dto.court_id);
      const booking: Booking = {
        id: crypto.randomUUID(),
        player_id: 'me',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        court,
        ...dto,
      };
      MOCK_MY_BOOKINGS.unshift(booking);
      return booking;
    }

    const profileId = this.auth.profile()?.id;
    if (!profileId) throw new Error('No autenticado');
    const { data, error } = await this.sb.client
      .from('bookings')
      .insert({ ...dto, player_id: profileId, status: 'confirmed' })
      .select('*, court:courts(*)')
      .single();
    if (error) throw error;
    return data as Booking;
  }

  async cancelBooking(id: string): Promise<void> {
    if (environment.useMock) {
      const b = MOCK_MY_BOOKINGS.find(b => b.id === id);
      if (b) b.status = 'cancelled';
      return;
    }
    const { error } = await this.sb.client
      .from('bookings')
      .update({ status: 'cancelled' as BookingStatus })
      .eq('id', id);
    if (error) throw error;
  }

  async getBooking(id: string): Promise<Booking | null> {
    if (environment.useMock) return MOCK_MY_BOOKINGS.find(b => b.id === id) ?? null;

    const { data, error } = await this.sb.client
      .from('bookings')
      .select('*, court:courts(*), player:profiles(full_name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Booking;
  }
}
