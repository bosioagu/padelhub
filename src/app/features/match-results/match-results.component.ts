import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchResultsService } from './match-results.service';
import { MatchResult } from '../../core/models/database.types';

@Component({
  selector: 'app-match-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Mis resultados</h1>
        <button (click)="showForm.set(!showForm())"
          class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90">
          {{ showForm() ? 'Cancelar' : '+ Registrar partido' }}
        </button>
      </div>

      <!-- Stats cards -->
      @if (!loading() && results().length > 0) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="card text-center py-4">
            <p class="text-3xl font-black text-[var(--color-primary)]">{{ stats().totalMatches }}</p>
            <p class="text-xs text-gray-500 mt-1">Partidos</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-3xl font-black text-green-600">{{ stats().wins }}</p>
            <p class="text-xs text-gray-500 mt-1">Victorias</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-3xl font-black text-red-500">{{ stats().losses }}</p>
            <p class="text-xs text-gray-500 mt-1">Derrotas</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-3xl font-black"
               [class.text-green-600]="stats().winRate >= 50"
               [class.text-red-500]="stats().winRate < 50">
              {{ stats().winRate }}%
            </p>
            <p class="text-xs text-gray-500 mt-1">Win rate</p>
          </div>
        </div>

        @if (stats().mostPlayedPartner) {
          <div class="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <span class="material-icons-round text-[var(--color-primary)]">favorite</span>
            <p class="text-sm text-[var(--color-primary)]">
              Compañero favorito: <strong>{{ stats().mostPlayedPartner }}</strong>
            </p>
          </div>
        }
      }

      <!-- Form -->
      @if (showForm()) {
        <div class="card mb-6">
          <h2 class="text-lg font-bold text-[var(--color-primary)] mb-4">Registrar resultado</h2>

          @if (formError()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{{ formError() }}</div>
          }

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Compañero</label>
              <input type="text" [(ngModel)]="form.partner" placeholder="Nombre compañero"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Rivales</label>
              <input type="text" [(ngModel)]="form.opponents" placeholder="Nombres rivales"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Resultado (sets)</label>
              <input type="text" [(ngModel)]="form.score" placeholder="6-3 6-4"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Cancha</label>
              <input type="text" [(ngModel)]="form.court_name" placeholder="Nombre de la cancha"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
              <input type="date" [(ngModel)]="form.played_at" [max]="today"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-2">¿Ganaron?</label>
              <div class="flex gap-3">
                <button type="button" (click)="form.is_win = true"
                  class="flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  [class.border-green-500]="form.is_win === true"
                  [class.bg-green-500]="form.is_win === true"
                  [class.text-white]="form.is_win === true"
                  [class.border-gray-200]="form.is_win !== true"
                  [class.text-gray-600]="form.is_win !== true">
                  ✓ Sí
                </button>
                <button type="button" (click)="form.is_win = false"
                  class="flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  [class.border-red-400]="form.is_win === false"
                  [class.bg-red-400]="form.is_win === false"
                  [class.text-white]="form.is_win === false"
                  [class.border-gray-200]="form.is_win !== false"
                  [class.text-gray-600]="form.is_win !== false">
                  ✗ No
                </button>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Notas (opcional)</label>
            <textarea [(ngModel)]="form.notes" rows="2" placeholder="Comentarios del partido..."
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            ></textarea>
          </div>

          <button (click)="onSave()" [disabled]="saving()"
            class="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
            @if (saving()) { Guardando... } @else { Guardar resultado }
          </button>
        </div>
      }

      <!-- Results list -->
      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (results().length === 0) {
        <div class="text-center py-16">
          <span class="material-icons-round text-5xl text-gray-300">emoji_events</span>
          <p class="text-gray-500 mt-3">Todavía no cargaste resultados</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (r of results(); track r.id) {
            <div class="card flex items-center gap-4">
              <div [class]="r.is_win ? 'badge-win' : 'badge-loss'" class="flex-shrink-0">
                {{ r.is_win ? 'Victoria' : 'Derrota' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm">{{ r.score }}</p>
                <p class="text-xs text-gray-500">
                  Con {{ r.partner }} vs {{ r.opponents }}
                </p>
                <p class="text-xs text-gray-400">{{ r.court_name }} · {{ r.played_at | date:'dd/MM/yyyy' }}</p>
              </div>
              @if (r.notes) {
                <div class="text-xs text-gray-400 italic max-w-[100px] truncate" [title]="r.notes">
                  {{ r.notes }}
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MatchResultsComponent implements OnInit {
  private service = inject(MatchResultsService);

  results = signal<MatchResult[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);

  today = new Date().toISOString().split('T')[0];

  form: {
    partner: string;
    opponents: string;
    score: string;
    court_name: string;
    played_at: string;
    is_win: boolean;
    notes: string;
  } = {
    partner: '',
    opponents: '',
    score: '',
    court_name: '',
    played_at: this.today,
    is_win: true,
    notes: '',
  };

  stats = computed(() => this.service.computeStats(this.results()));

  async ngOnInit() {
    try {
      this.results.set(await this.service.getMyResults());
    } finally {
      this.loading.set(false);
    }
  }

  async onSave() {
    if (!this.form.partner || !this.form.opponents || !this.form.score) {
      this.formError.set('Completá compañero, rivales y resultado.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const result = await this.service.createResult({
        booking_id: null,
        partner: this.form.partner,
        opponents: this.form.opponents,
        score: this.form.score,
        court_name: this.form.court_name || 'Sin especificar',
        played_at: new Date(this.form.played_at).toISOString(),
        is_win: this.form.is_win,
        notes: this.form.notes || null,
      });

      this.results.update(list => [result, ...list]);
      this.showForm.set(false);
      this.resetForm();
    } catch (err: unknown) {
      this.formError.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm() {
    this.form = {
      partner: '', opponents: '', score: '',
      court_name: '', played_at: this.today,
      is_win: true, notes: '',
    };
  }
}
