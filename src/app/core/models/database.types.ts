/** Supabase DB types — mirrors the database schema */

export type UserRole = 'admin' | 'player';
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';
export type CourtSurface = 'grass' | 'clay' | 'concrete' | 'turf';
export type NotificationType = 'email_reminder_24h' | 'push_1h' | 'booking_confirmation' | 'match_prompt';
export type ClassLevel = PlayerLevel;

// ──────────────────────────────────────────
// Table row types
// ──────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  level: PlayerLevel;
  notification_prefs: NotificationPrefs;
  avatar_url: string | null;
  created_at: string;
}

export interface NotificationPrefs {
  email_24h: boolean;
  push_1h: boolean;
  match_prompt: boolean;
}

export interface Court {
  id: string;
  name: string;
  surface: CourtSurface;
  is_indoor: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  court_id: string;
  player_id: string;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  status: BookingStatus;
  players_json: BookingPlayer[]; // additional players
  created_at: string;
  // joined
  court?: Court;
  player?: Profile;
}

export interface BookingPlayer {
  email: string;
  name: string;
}

export interface MatchResult {
  id: string;
  booking_id: string | null;
  player_id: string;
  score: string;       // e.g. "6-3 6-4"
  partner: string;     // partner name
  opponents: string;   // opponents names
  court_name: string;
  played_at: string;   // ISO datetime
  notes: string | null;
  is_win: boolean;
  created_at: string;
}

export interface AcademyClass {
  id: string;
  name: string;
  coach: string;
  level: ClassLevel;
  schedule_json: ClassSchedule[];
  max_capacity: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  // computed
  enrolled_count?: number;
}

export interface ClassSchedule {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  start_time: string; // "HH:mm"
  end_time: string;
}

export interface Enrollment {
  id: string;
  class_id: string;
  player_id: string;
  enrolled_at: string;
  // joined
  academy_class?: AcademyClass;
  player?: Profile;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: NotificationType;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  metadata: Record<string, unknown>;
}

// ──────────────────────────────────────────
// UI / helper types
// ──────────────────────────────────────────

export interface TimeSlot {
  time: string;       // "HH:mm"
  label: string;      // "09:00"
  available: boolean;
  booking?: Booking;
  isBlocked: boolean;
}

export interface WeekDay {
  date: Date;
  label: string;      // "Lun 7"
  isToday: boolean;
}
