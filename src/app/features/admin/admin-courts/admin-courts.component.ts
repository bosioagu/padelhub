import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourtsService } from '../../courts/courts.service';
import { Court, CourtSurface } from '../../../core/models/database.types';

@Component({
  selector: 'app-admin-courts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Gestión de canchas</h1>
        <button (click)="openForm()"
          class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg">
          + Nueva cancha
        </button>
      </div>

      <!-- Form -->
      @if (showForm()) {
        <div class="card mb-6">
          <h2 class="font-bold text-[var(--color-primary)] mb-4">
            {{ editingId() ? 'Editar cancha' : 'Nueva cancha' }}
          </h2>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="form.name"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Cancha 1"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Superficie</label>
              <select [(ngModel)]="form.surface"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                @for (s of surfaces; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex items-center gap-6 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.is_indoor"
                class="w-4 h-4 rounded accent-[var(--color-primary)]" />
              <span class="text-sm text-gray-700">Cancha techada</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.is_active"
                class="w-4 h-4 rounded accent-[var(--color-primary)]" />
              <span class="text-sm text-gray-700">Activa</span>
            </label>
          </div>

          <div class="flex gap-3">
            <button (click)="saveCourt()" [disabled]="saving()"
              class="bg-[var(--color-primary)] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
              @if (saving()) { Guardando... } @else { Guardar }
            </button>
            <button (click)="cancelForm()"
              class="border border-gray-200 text-gray-600 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      }

      <!-- List -->
      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else {
        <div class="space-y-3">
          @for (court of courts(); track court.id) {
            <div class="card flex items-center gap-4"
              [class.opacity-60]="!court.is_active">
              <div class="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span class="material-icons-round text-[var(--color-primary)]">
                  {{ court.is_indoor ? 'home' : 'wb_sunny' }}
                </span>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-gray-900">{{ court.name }}</p>
                  @if (!court.is_active) {
                    <span class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactiva</span>
                  }
                </div>
                <p class="text-xs text-gray-400">
                  {{ surfaceLabel(court.surface) }} · {{ court.is_indoor ? 'Techada' : 'Descubierta' }}
                </p>
              </div>
              <div class="flex gap-2">
                <button (click)="editCourt(court)"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[var(--color-primary)] transition-colors">
                  <span class="material-icons-round text-base">edit</span>
                </button>
                <button (click)="toggleActive(court)"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  [class.text-green-500]="!court.is_active"
                  [class.text-red-400]="court.is_active">
                  <span class="material-icons-round text-base">
                    {{ court.is_active ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminCourtsComponent implements OnInit {
  private service = inject(CourtsService);

  courts = signal<Court[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form: { name: string; surface: CourtSurface; is_indoor: boolean; is_active: boolean } = {
    name: '', surface: 'turf', is_indoor: false, is_active: true,
  };

  readonly surfaces: { value: CourtSurface; label: string }[] = [
    { value: 'turf', label: 'Césped sintético' },
    { value: 'grass', label: 'Césped natural' },
    { value: 'clay', label: 'Tierra batida' },
    { value: 'concrete', label: 'Hormigón' },
  ];

  surfaceLabel = (s: string) => this.surfaces.find(x => x.value === s)?.label ?? s;

  async ngOnInit() {
    try {
      this.courts.set(await this.service.getAllCourts());
    } finally {
      this.loading.set(false);
    }
  }

  openForm() {
    this.editingId.set(null);
    this.form = { name: '', surface: 'turf', is_indoor: false, is_active: true };
    this.showForm.set(true);
  }

  editCourt(court: Court) {
    this.editingId.set(court.id);
    this.form = { name: court.name, surface: court.surface, is_indoor: court.is_indoor, is_active: court.is_active };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  async saveCourt() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);

    try {
      const id = this.editingId();
      if (id) {
        await this.service.updateCourt(id, this.form);
        this.courts.update(list => list.map(c => c.id === id ? { ...c, ...this.form } : c));
      } else {
        const created = await this.service.createCourt(this.form);
        this.courts.update(list => [created, ...list]);
      }
      this.cancelForm();
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(court: Court) {
    await this.service.updateCourt(court.id, { is_active: !court.is_active });
    this.courts.update(list => list.map(c => c.id === court.id ? { ...c, is_active: !c.is_active } : c));
  }
}
