import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import { MatchResult } from '../../core/models/database.types';
import { environment } from '../../../environments/environment';
import { MOCK_MATCH_RESULTS } from '../../core/services/mock-data';

export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  mostPlayedPartner: string | null;
}

@Injectable({ providedIn: 'root' })
export class MatchResultsService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);

  async getMyResults(limit = 20): Promise<MatchResult[]> {
    if (environment.useMock) return [...MOCK_MATCH_RESULTS].slice(0, limit);

    const profileId = this.auth.profile()?.id;
    if (!profileId) return [];

    const { data, error } = await this.sb.client
      .from('match_results')
      .select('*')
      .eq('player_id', profileId)
      .order('played_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as MatchResult[]) ?? [];
  }

  async createResult(dto: Omit<MatchResult, 'id' | 'player_id' | 'created_at'>): Promise<MatchResult> {
    if (environment.useMock) {
      const result: MatchResult = {
        ...dto,
        id: crypto.randomUUID(),
        player_id: 'me',
        created_at: new Date().toISOString(),
      };
      MOCK_MATCH_RESULTS.unshift(result);
      return result;
    }

    const profileId = this.auth.profile()?.id;
    if (!profileId) throw new Error('No autenticado');
    const { data, error } = await this.sb.client
      .from('match_results')
      .insert({ ...dto, player_id: profileId })
      .select()
      .single();
    if (error) throw error;
    return data as MatchResult;
  }

  computeStats(results: MatchResult[]): MatchStats {
    const wins = results.filter(r => r.is_win).length;
    const total = results.length;
    const partnerCount: Record<string, number> = {};
    for (const r of results) {
      partnerCount[r.partner] = (partnerCount[r.partner] ?? 0) + 1;
    }
    const mostPlayedPartner = Object.keys(partnerCount).length > 0
      ? Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0][0]
      : null;
    return {
      totalMatches: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      mostPlayedPartner,
    };
  }
}
