import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademyService } from './academy.service';
import { AcademyClass, Enrollment, ClassSchedule } from '../../core/models/database.types';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LEVEL_LABELS: Record<string, string> = {
  beginner: '🌱 Principiante',
  intermediate: '⚡ Intermedio',
  advanced: '🔥 Avanzado',
};

@Component({
  selector: 'app-academy',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[var(--color-primary)]">Academia</h1>
        <p class="text-sm text-gray-500 mt-0.5">Clases y entrenamientos disponibles</p>
      </div>

      <!-- My enrollments -->
      @if (myEnrollments().length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Mis clases</h2>
          <div class="grid md:grid-cols-2 gap-3">
            @for (e of myEnrollments(); track e.id) {
              <div class="card border-l-4 border-[var(--color-accent)]">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="font-bold text-[var(--color-primary)]">{{ e.academy_class?.name }}</p>
                    <p class="text-sm text-gray-500">Prof. {{ e.academy_class?.coach }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ levelLabel(e.academy_class?.level) }}</p>
                  </div>
                  <button (click)="unenroll(e)"
                    class="text-xs text-red-400 hover:text-red-600 font-medium mt-1">
                    Darme de baja
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-1">
                  @for (s of e.academy_class?.schedule_json; track $index) {
                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {{ dayName(s.day) }} {{ s.start_time }}–{{ s.end_time }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- All classes -->
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Clases disponibles</h2>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (classes().length === 0) {
        <div class="text-center py-16">
          <span class="material-icons-round text-5xl text-gray-300">school</span>
          <p class="text-gray-500 mt-3">No hay clases disponibles por el momento</p>
        </div>
      } @else {
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (cls of classes(); track cls.id) {
            @let isEnrolled = isAlreadyEnrolled(cls.id);
            @let isFull = (cls.enrolled_count ?? 0) >= cls.max_capacity;
            <div class="card hover:shadow-md transition-shadow">
              <!-- Badge de nivel -->
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {{ levelLabel(cls.level) }}
                </span>
                @if (isFull) {
                  <span class="text-xs text-red-400 font-medium">Completo</span>
                } @else {
                  <span class="text-xs text-gray-400">{{ cls.enrolled_count }}/{{ cls.max_capacity }}</span>
                }
              </div>

              <h3 class="font-bold text-gray-900 mb-0.5">{{ cls.name }}</h3>
              <p class="text-sm text-gray-500 mb-3">Prof. {{ cls.coach }}</p>

              @if (cls.description) {
                <p class="text-xs text-gray-400 mb-3">{{ cls.description }}</p>
              }

              <!-- Schedule -->
              <div class="flex flex-wrap gap-1 mb-4">
                @for (s of cls.schedule_json; track $index) {
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {{ dayName(s.day) }} {{ s.start_time }}
                  </span>
                }
              </div>

              <!-- Capacity bar -->
              <div class="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                <div class="h-full rounded-full transition-all"
                  [ngClass]="isFull ? 'bg-red-400' : 'bar-accent'"
                  [style.width.%]="capacityPct(cls)">
                </div>
              </div>

              <button
                (click)="toggleEnroll(cls)"
                [disabled]="(isFull && !isEnrolled) || actionLoading() === cls.id"
                class="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                [ngClass]="isEnrolled ? 'btn-danger-soft' : 'btn-primary-solid'"
              >
                @if (actionLoading() === cls.id) {
                  Procesando...
                } @else if (isEnrolled) {
                  Darme de baja
                } @else if (isFull) {
                  Sin cupo
                } @else {
                  Inscribirme
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AcademyComponent implements OnInit {
  private service = inject(AcademyService);

  classes = signal<AcademyClass[]>([]);
  myEnrollments = signal<Enrollment[]>([]);
  loading = signal(true);
  actionLoading = signal<string | null>(null);

  levelLabel = (level?: string) => LEVEL_LABELS[level ?? ''] ?? level ?? '';
  dayName = (day: number) => DAY_NAMES[day] ?? '';
  capacityPct = (cls: AcademyClass) =>
    Math.min(100, Math.round(((cls.enrolled_count ?? 0) / cls.max_capacity) * 100));

  isAlreadyEnrolled(classId: string): boolean {
    return this.myEnrollments().some(e => e.class_id === classId);
  }

  async ngOnInit() {
    try {
      const [classes, enrollments] = await Promise.all([
        this.service.getClasses(),
        this.service.getMyEnrollments(),
      ]);
      this.classes.set(classes);
      this.myEnrollments.set(enrollments);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleEnroll(cls: AcademyClass) {
    this.actionLoading.set(cls.id);
    try {
      if (this.isAlreadyEnrolled(cls.id)) {
        await this.service.unenroll(cls.id);
        this.myEnrollments.update(list => list.filter(e => e.class_id !== cls.id));
        this.classes.update(list =>
          list.map(c => c.id === cls.id
            ? { ...c, enrolled_count: Math.max(0, (c.enrolled_count ?? 1) - 1) }
            : c
          )
        );
      } else {
        await this.service.enroll(cls.id);
        const enrollment: Enrollment = {
          id: crypto.randomUUID(),
          class_id: cls.id,
          player_id: '',
          enrolled_at: new Date().toISOString(),
          academy_class: cls,
        };
        this.myEnrollments.update(list => [...list, enrollment]);
        this.classes.update(list =>
          list.map(c => c.id === cls.id
            ? { ...c, enrolled_count: (c.enrolled_count ?? 0) + 1 }
            : c
          )
        );
      }
    } finally {
      this.actionLoading.set(null);
    }
  }

  async unenroll(enrollment: Enrollment) {
    await this.service.unenroll(enrollment.class_id);
    this.myEnrollments.update(list => list.filter(e => e.id !== enrollment.id));
    this.classes.update(list =>
      list.map(c => c.id === enrollment.class_id
        ? { ...c, enrolled_count: Math.max(0, (c.enrolled_count ?? 1) - 1) }
        : c
      )
    );
  }
}
