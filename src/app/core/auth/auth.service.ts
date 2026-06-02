import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase.service';
import { Profile, UserRole } from '../models/database.types';
import { environment } from '../../../environments/environment';
import { MOCK_PROFILE, MOCK_ADMIN_PROFILE } from '../services/mock-data';

export interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

/**
 * Central auth service.
 * En modo mock (environment.useMock = true) simula un usuario logueado.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService);
  private readonly router = inject(Router);

  // ── Signals ──
  private _session = signal<Session | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal<boolean>(true);

  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly isAuthenticated = computed(() => !!this._session() || !!this._profile());
  readonly role = computed<UserRole | null>(() => this._profile()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isPlayer = computed(() => this.role() === 'player');

  /** Permite cambiar entre player/admin en modo mock */
  private _mockIsAdmin = signal(false);

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (environment.useMock) {
      // Mock: loguear automáticamente como player
      this._profile.set(this._mockIsAdmin() ? MOCK_ADMIN_PROFILE : MOCK_PROFILE);
      // Crear session falsa para que isAuthenticated() sea true
      this._session.set({ user: { id: 'mock-user' } } as unknown as Session);
      this._loading.set(false);
      return;
    }

    const { data } = await this.sb.client.auth.getSession();
    this._session.set(data.session);

    if (data.session) {
      await this.loadProfile(data.session.user.id);
    }
    this._loading.set(false);

    this.sb.client.auth.onAuthStateChange(async (_, session) => {
      this._session.set(session);
      if (session) {
        await this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.sb.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    this._profile.set(data as Profile | null);
  }

  // ── Auth methods ──

  async signUpWithEmail(email: string, password: string) {
    if (environment.useMock) return { data: {}, error: null };
    return this.sb.client.auth.signUp({ email, password });
  }

  async signInWithEmail(email: string, password: string) {
    if (environment.useMock) {
      this._profile.set(MOCK_PROFILE);
      this._session.set({ user: { id: 'mock-user' } } as unknown as Session);
      return { data: {}, error: null };
    }
    return this.sb.client.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    if (environment.useMock) return { data: {}, error: null };
    return this.sb.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async signOut() {
    if (environment.useMock) {
      this._profile.set(null);
      this._session.set(null);
      this.router.navigate(['/auth/login']);
      return;
    }
    await this.sb.client.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  async createProfile(data: Omit<Profile, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    if (environment.useMock) {
      this._profile.set({ ...MOCK_PROFILE, ...data });
      return;
    }
    const user = this._session()?.user;
    if (!user) return;

    const { data: profile, error } = await this.sb.client
      .from('profiles')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (!error && profile) {
      this._profile.set(profile as Profile);
    }
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    if (environment.useMock) {
      this._profile.update(p => p ? { ...p, ...updates } : p);
      return;
    }
    const profile = this._profile();
    if (!profile) return;

    const { data } = await this.sb.client
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (data) this._profile.set(data as Profile);
  }

  /** Solo mock: cambia rol para probar ambas vistas */
  toggleMockRole() {
    if (!environment.useMock) return;
    const isAdmin = this._profile()?.role === 'admin';
    this._profile.set(isAdmin ? MOCK_PROFILE : MOCK_ADMIN_PROFILE);
    this.router.navigate(isAdmin ? ['/courts'] : ['/admin']);
  }

  get currentUser(): User | null {
    return this._session()?.user ?? null;
  }
}
