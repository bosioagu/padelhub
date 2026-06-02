import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import { AcademyClass, Enrollment } from '../../core/models/database.types';
import { environment } from '../../../environments/environment';
import { MOCK_CLASSES } from '../../core/services/mock-data';

// In-memory mock enrollments
const MOCK_ENROLLMENTS: Enrollment[] = [];

@Injectable({ providedIn: 'root' })
export class AcademyService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);

  async getClasses(): Promise<AcademyClass[]> {
    if (environment.useMock) return MOCK_CLASSES.filter(c => c.is_active);

    const { data, error } = await this.sb.client
      .from('classes')
      .select('*, enrollments(count)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return ((data as (AcademyClass & { enrollments: { count: number }[] })[]) ?? []).map(c => ({
      ...c, enrolled_count: c.enrollments?.[0]?.count ?? 0,
    }));
  }

  async getAllClasses(): Promise<AcademyClass[]> {
    if (environment.useMock) return [...MOCK_CLASSES];

    const { data, error } = await this.sb.client
      .from('classes')
      .select('*, enrollments(count)')
      .order('name');
    if (error) throw error;
    return ((data as (AcademyClass & { enrollments: { count: number }[] })[]) ?? []).map(c => ({
      ...c, enrolled_count: c.enrollments?.[0]?.count ?? 0,
    }));
  }

  async getMyEnrollments(): Promise<Enrollment[]> {
    if (environment.useMock) return [...MOCK_ENROLLMENTS];

    const profileId = this.auth.profile()?.id;
    if (!profileId) return [];
    const { data, error } = await this.sb.client
      .from('enrollments')
      .select('*, academy_class:classes(*)')
      .eq('player_id', profileId);
    if (error) throw error;
    return (data as Enrollment[]) ?? [];
  }

  async enroll(classId: string): Promise<void> {
    if (environment.useMock) {
      const cls = MOCK_CLASSES.find(c => c.id === classId);
      MOCK_ENROLLMENTS.push({
        id: crypto.randomUUID(),
        class_id: classId,
        player_id: 'me',
        enrolled_at: new Date().toISOString(),
        academy_class: cls,
      });
      return;
    }
    const profileId = this.auth.profile()?.id;
    if (!profileId) throw new Error('No autenticado');
    const { error } = await this.sb.client.from('enrollments').insert({ class_id: classId, player_id: profileId });
    if (error) throw error;
  }

  async unenroll(classId: string): Promise<void> {
    if (environment.useMock) {
      const i = MOCK_ENROLLMENTS.findIndex(e => e.class_id === classId);
      if (i >= 0) MOCK_ENROLLMENTS.splice(i, 1);
      return;
    }
    const profileId = this.auth.profile()?.id;
    if (!profileId) throw new Error('No autenticado');
    const { error } = await this.sb.client.from('enrollments').delete().eq('class_id', classId).eq('player_id', profileId);
    if (error) throw error;
  }

  async createClass(cls: Omit<AcademyClass, 'id' | 'created_at' | 'enrolled_count'>): Promise<AcademyClass> {
    if (environment.useMock) {
      const c: AcademyClass = { ...cls, id: crypto.randomUUID(), created_at: new Date().toISOString(), enrolled_count: 0 };
      MOCK_CLASSES.push(c);
      return c;
    }
    const { data, error } = await this.sb.client.from('classes').insert(cls).select().single();
    if (error) throw error;
    return data as AcademyClass;
  }

  async updateClass(id: string, updates: Partial<AcademyClass>): Promise<void> {
    if (environment.useMock) {
      const i = MOCK_CLASSES.findIndex(c => c.id === id);
      if (i >= 0) Object.assign(MOCK_CLASSES[i], updates);
      return;
    }
    const { error } = await this.sb.client.from('classes').update(updates).eq('id', id);
    if (error) throw error;
  }

  async getEnrollmentsForClass(classId: string): Promise<Enrollment[]> {
    if (environment.useMock) return MOCK_ENROLLMENTS.filter(e => e.class_id === classId);

    const { data, error } = await this.sb.client
      .from('enrollments')
      .select('*, player:profiles(full_name, phone, level)')
      .eq('class_id', classId);
    if (error) throw error;
    return (data as Enrollment[]) ?? [];
  }
}
