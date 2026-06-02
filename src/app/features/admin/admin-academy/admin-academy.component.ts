import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademyService } from '../../academy/academy.service';
import { AcademyClass, ClassLevel, ClassSchedule } from '../../../core/models/database.types';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
  selector: 'app-admin-academy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Gestión de academia</h1>
        <button (click)="openForm()"
          class="bg-[var(--color-accent)] text-[var(--color-primary)] font-bold text-sm px-4 py-2 rounded-lg">
          + Nueva clase
        </button>
      </div>

      <!-- Form -->
      @if (showForm()) {
        <div class="card mb-6">
          <h2 class="font-bold text-[var(--color-primary)] mb-4">{{ editingId() ? 'Editar clase' : 'Nueva clase' }}</h2>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="form.name"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Clase principiantes"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Coach</label>
              <input type="text" [(ngModel)]="form.coach"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Nombre del coach"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Nivel</label>
              <select [(ngModel)]="form.level"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="beginner">🌱 Principiante</option>
                <option value="intermediate">⚡ Intermedio</option>
                <option value="advanced">🔥 Avanzado</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Capacidad máx.</label>
              <input type="number" [(ngModel)]="form.max_capacity" min="1" max="50"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
            <textarea [(ngModel)]="form.description" rows="2"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              placeholder="Descripción de la clase...">
            </textarea>
          </div>

          <!-- Schedule builder -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-gray-600">Horarios recurrentes</label>
              <button type="button" (click)="addSchedule()"
                class="text-xs text-[var(--color-primary)] font-semibold hover:underline">+ Agregar día</button>
            </div>
            @for (s of form.schedule_json; track $index) {
              <div class="flex gap-2 mb-2 items-center">
                <select [(ngModel)]="s.day"
                  class="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  @for (d of dayNames; track $index) {
                    <option [value]="$index">{{ d }}</option>
                  }
                </select>
                <input type="time" [(ngModel)]="s.start_time"
                  class="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <span class="text-gray-400 text-sm">a</span>
                <input type="time" [(ngModel)]="s.end_time"
                  class="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <button (click)="removeSchedule($index)"
                  class="text-red-400 hover:text-red-600">
                  <span class="material-icons-round text-base">close</span>
                </button>
              </div>
            }
          </div>

          <div class="flex gap-3">
            <button (click)="saveClass()" [disabled]="saving()"
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
          @for (cls of classes(); track cls.id) {
            <div class="card">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-900">{{ cls.name }}</h3>
                    @if (!cls.is_active) {
                      <span class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactiva</span>
                    }
                  </div>
                  <p class="text-sm text-gray-500">Prof. {{ cls.coach }} · {{ levelLabel(cls.level) }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ cls.enrolled_count ?? 0 }}/{{ cls.max_capacity }} inscriptos</p>
                </div>
                <div class="flex gap-1">
                  <button (click)="editClass(cls)"
                    class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <span class="material-icons-round text-base">edit</span>
                  </button>
                  <button (click)="toggleClassActive(cls)"
                    class="p-2 rounded-lg hover:bg-gray-100"
                    [class.text-red-400]="cls.is_active"
                    [class.text-green-500]="!cls.is_active">
                    <span class="material-icons-round text-base">{{ cls.is_active ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-1 mt-3">
                @for (s of cls.schedule_json; track $index) {
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {{ dayName(s.day) }} {{ s.start_time }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminAcademyComponent implements OnInit {
  private service = inject(AcademyService);

  classes = signal<AcademyClass[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  readonly dayNames = DAY_NAMES;

  form: {
    name: string; coach: string; level: ClassLevel;
    max_capacity: number; description: string; is_active: boolean;
    schedule_json: ClassSchedule[];
  } = this.emptyForm();

  levelLabel = (l: string) => ({ beginner: '🌱 Principiante', intermediate: '⚡ Intermedio', advanced: '🔥 Avanzado' }[l] ?? l);
  dayName = (d: number) => DAY_NAMES[d] ?? '';

  private emptyForm() {
    return { name: '', coach: '', level: 'beginner' as ClassLevel, max_capacity: 10, description: '', is_active: true, schedule_json: [] as ClassSchedule[] };
  }

  async ngOnInit() {
    try {
      this.classes.set(await this.service.getAllClasses());
    } finally {
      this.loading.set(false);
    }
  }

  openForm() { this.editingId.set(null); this.form = this.emptyForm(); this.showForm.set(true); }
  cancelForm() { this.showForm.set(false); this.editingId.set(null); }

  editClass(cls: AcademyClass) {
    this.editingId.set(cls.id);
    this.form = {
      name: cls.name, coach: cls.coach, level: cls.level,
      max_capacity: cls.max_capacity, description: cls.description ?? '',
      is_active: cls.is_active, schedule_json: [...cls.schedule_json],
    };
    this.showForm.set(true);
  }

  addSchedule() {
    this.form.schedule_json = [...this.form.schedule_json, { day: 1, start_time: '09:00', end_time: '10:00' }];
  }

  removeSchedule(i: number) {
    this.form.schedule_json = this.form.schedule_json.filter((_, idx) => idx !== i);
  }

  async saveClass() {
    if (!this.form.name || !this.form.coach) return;
    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await this.service.updateClass(id, this.form);
        this.classes.update(list => list.map(c => c.id === id ? { ...c, ...this.form } : c));
      } else {
        const created = await this.service.createClass(this.form);
        this.classes.update(list => [created, ...list]);
      }
      this.cancelForm();
    } finally {
      this.saving.set(false);
    }
  }

  async toggleClassActive(cls: AcademyClass) {
    await this.service.updateClass(cls.id, { is_active: !cls.is_active });
    this.classes.update(list => list.map(c => c.id === cls.id ? { ...c, is_active: !c.is_active } : c));
  }
}
