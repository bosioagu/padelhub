import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Booking, Court } from '../../core/models/database.types';
import { environment } from '../../../environments/environment';
import { MOCK_BOOKINGS, MOCK_COURTS, MOCK_MY_BOOKINGS } from '../../core/services/mock-data';

@Injectable({ providedIn: 'root' })
export class CourtsService {
  private sb = inject(SupabaseService);

  async getCourts(): Promise<Court[]> {
    if (environment.useMock) return MOCK_COURTS.filter(c => c.is_active);

    const { data, error } = await this.sb.client
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data as Court[]) ?? [];
  }

  async getBookingsForRange(from: string, to: string): Promise<Booking[]> {
    if (environment.useMock) {
      const f = new Date(from).getTime();
      const t = new Date(to).getTime();
      return [...MOCK_BOOKINGS, ...MOCK_MY_BOOKINGS].filter(b => {
        const s = new Date(b.start_time).getTime();
        return s >= f && s <= t;
      });
    }

    const { data, error } = await this.sb.client
      .from('bookings')
      .select('*, court:courts(*), player:profiles(full_name)')
      .eq('status', 'confirmed')
      .gte('start_time', from)
      .lte('end_time', to)
      .order('start_time');
    if (error) throw error;
    return (data as Booking[]) ?? [];
  }

  async getAllCourts(): Promise<Court[]> {
    if (environment.useMock) return MOCK_COURTS;

    const { data, error } = await this.sb.client
      .from('courts')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data as Court[]) ?? [];
  }

  async createCourt(court: Omit<Court, 'id' | 'created_at'>): Promise<Court> {
    if (environment.useMock) {
      const c: Court = { ...court, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      MOCK_COURTS.push(c);
      return c;
    }
    const { data, error } = await this.sb.client.from('courts').insert(court).select().single();
    if (error) throw error;
    return data as Court;
  }

  async updateCourt(id: string, updates: Partial<Court>): Promise<void> {
    if (environment.useMock) {
      const i = MOCK_COURTS.findIndex(c => c.id === id);
      if (i >= 0) Object.assign(MOCK_COURTS[i], updates);
      return;
    }
    const { error } = await this.sb.client.from('courts').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deleteCourt(id: string): Promise<void> {
    await this.updateCourt(id, { is_active: false });
  }
}
