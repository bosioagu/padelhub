import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Singleton Supabase client exposed as an Angular service.
 * Inject this wherever direct DB/auth access is needed.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  /** Shortcut to the Supabase storage API */
  get storage() {
    return this.client.storage;
  }

  /** Shortcut to Supabase realtime */
  get realtime() {
    return this.client.realtime;
  }

  /** Typed table query shortcut */
  from<T = unknown>(table: string) {
    return this.client.from(table) as ReturnType<SupabaseClient['from']>;
  }
}
