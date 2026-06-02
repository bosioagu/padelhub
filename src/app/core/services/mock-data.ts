/**
 * Mock data para desarrollo sin Supabase.
 * Reemplaza las llamadas reales cuando MOCK_MODE = true en environment.
 */
import {
  Court, Booking, MatchResult, AcademyClass, Profile, NotificationLog
} from '../models/database.types';

export const MOCK_COURTS: Court[] = [
  { id: '1', name: 'Cancha 1', surface: 'turf', is_indoor: false, is_active: true, created_at: '' },
  { id: '2', name: 'Cancha 2', surface: 'turf', is_indoor: false, is_active: true, created_at: '' },
  { id: '3', name: 'Cancha Techada A', surface: 'concrete', is_indoor: true, is_active: true, created_at: '' },
  { id: '4', name: 'Cancha Techada B', surface: 'concrete', is_indoor: true, is_active: true, created_at: '' },
];

const TODAY = new Date();
const tomorrow = new Date(TODAY); tomorrow.setDate(TODAY.getDate() + 1);
const dayAfter = new Date(TODAY); dayAfter.setDate(TODAY.getDate() + 2);

function slot(day: Date, h: number, dur = 90, courtId = '1'): Partial<Booking> {
  const start = new Date(day); start.setHours(h, 0, 0, 0);
  const end   = new Date(start); end.setMinutes(end.getMinutes() + dur);
  return {
    court_id: courtId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: 'confirmed',
  };
}

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', player_id: 'player1', players_json: [{ name: 'Carlos', email: '' }], created_at: '', court: MOCK_COURTS[0], ...slot(TODAY, 9) } as Booking,
  { id: 'b2', player_id: 'player2', players_json: [], created_at: '', court: MOCK_COURTS[0], ...slot(TODAY, 11) } as Booking,
  { id: 'b3', player_id: 'player3', players_json: [], created_at: '', court: MOCK_COURTS[0], ...slot(TODAY, 14, 90) } as Booking,
  { id: 'b4', player_id: 'player4', players_json: [], created_at: '', court: MOCK_COURTS[1], ...slot(TODAY, 10, 90, '2') } as Booking,
  { id: 'b5', player_id: 'player5', players_json: [], created_at: '', court: MOCK_COURTS[2], ...slot(tomorrow, 9, 90, '3') } as Booking,
  { id: 'b6', player_id: 'player1', players_json: [{ name: 'Ana', email: 'ana@demo.com' }], created_at: '', court: MOCK_COURTS[1], ...slot(tomorrow, 16, 90, '2') } as Booking,
];

const threeDaysAgo = new Date(TODAY.getTime() - 3 * 86400000);

export const MOCK_MY_BOOKINGS: Booking[] = [
  {
    id: 'mb1', player_id: 'me', court: MOCK_COURTS[1],
    players_json: [{ name: 'Martín', email: 'martin@demo.com' }, { name: 'Luisa', email: '' }],
    created_at: '',
    ...slot(tomorrow, 19, 90, '2'),
    status: 'confirmed',
  } as Booking,
  {
    id: 'mb2', player_id: 'me', court: MOCK_COURTS[0],
    players_json: [],
    created_at: '',
    ...slot(dayAfter, 10, 90, '1'),
    status: 'confirmed',
  } as Booking,
  {
    id: 'mb3', player_id: 'me', court: MOCK_COURTS[2],
    players_json: [],
    created_at: '',
    ...slot(threeDaysAgo, 9, 90, '3'),
    status: 'completed',
  } as Booking,
];

export const MOCK_MATCH_RESULTS: MatchResult[] = [
  { id: 'r1', booking_id: 'mb3', player_id: 'me', score: '6-3 6-4', partner: 'Martín', opponents: 'Carlos y Ana', court_name: 'Cancha Techada A', played_at: new Date(TODAY.getTime() - 3 * 86400000).toISOString(), notes: 'Gran partido, saque funcionó perfecto', is_win: true, created_at: '' },
  { id: 'r2', booking_id: null, player_id: 'me', score: '4-6 3-6', partner: 'Luisa', opponents: 'Pedro y Juan', court_name: 'Cancha 1', played_at: new Date(TODAY.getTime() - 10 * 86400000).toISOString(), notes: null, is_win: false, created_at: '' },
  { id: 'r3', booking_id: null, player_id: 'me', score: '6-1 6-2', partner: 'Martín', opponents: 'Roque y Silvia', court_name: 'Cancha 2', played_at: new Date(TODAY.getTime() - 17 * 86400000).toISOString(), notes: 'Dominio total del partido', is_win: true, created_at: '' },
  { id: 'r4', booking_id: null, player_id: 'me', score: '7-5 6-7 6-4', partner: 'Martín', opponents: 'Torres y Gómez', court_name: 'Cancha 1', played_at: new Date(TODAY.getTime() - 24 * 86400000).toISOString(), notes: 'Remontada épica en el tercero', is_win: true, created_at: '' },
];

export const MOCK_CLASSES: AcademyClass[] = [
  {
    id: 'c1', name: 'Principiantes Martes', coach: 'Rodrigo Sánchez',
    level: 'beginner', max_capacity: 8, is_active: true,
    description: 'Clases para jugadores sin experiencia. Técnica básica y fundamentos.',
    schedule_json: [{ day: 2, start_time: '09:00', end_time: '10:30' }, { day: 5, start_time: '09:00', end_time: '10:30' }],
    created_at: '', enrolled_count: 5,
  },
  {
    id: 'c2', name: 'Intermedio Vespertino', coach: 'Marina López',
    level: 'intermediate', max_capacity: 6, is_active: true,
    description: 'Perfeccionamiento de golpes y táctica de juego en pareja.',
    schedule_json: [{ day: 1, start_time: '18:00', end_time: '19:30' }, { day: 3, start_time: '18:00', end_time: '19:30' }],
    created_at: '', enrolled_count: 6,
  },
  {
    id: 'c3', name: 'Avanzados / Competición', coach: 'Diego Ferrara',
    level: 'advanced', max_capacity: 4, is_active: true,
    description: 'Entrenamiento intensivo para jugadores de nivel competitivo.',
    schedule_json: [{ day: 2, start_time: '20:00', end_time: '21:30' }, { day: 4, start_time: '20:00', end_time: '21:30' }],
    created_at: '', enrolled_count: 2,
  },
  {
    id: 'c4', name: 'Kids Pádel', coach: 'Valentina Cruz',
    level: 'beginner', max_capacity: 10, is_active: true,
    description: 'Introducción al pádel para chicos de 7 a 14 años.',
    schedule_json: [{ day: 6, start_time: '10:00', end_time: '11:00' }],
    created_at: '', enrolled_count: 7,
  },
];

export const MOCK_PROFILE: Profile = {
  id: 'me',
  user_id: 'user-mock',
  full_name: 'Demo Usuario',
  phone: '+54 11 9999-8888',
  role: 'player',
  level: 'intermediate',
  notification_prefs: { email_24h: true, push_1h: true, match_prompt: true },
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export const MOCK_ADMIN_PROFILE: Profile = {
  ...MOCK_PROFILE,
  id: 'admin',
  user_id: 'user-admin',
  full_name: 'Admin PadelHub',
  role: 'admin',
};

export const MOCK_PLAYERS: Profile[] = [
  MOCK_PROFILE,
  { ...MOCK_PROFILE, id: 'p2', full_name: 'Martín García', level: 'advanced', phone: '+54 11 5555-1111' },
  { ...MOCK_PROFILE, id: 'p3', full_name: 'Luisa Pérez', level: 'beginner', phone: null },
  { ...MOCK_PROFILE, id: 'p4', full_name: 'Carlos Rodríguez', level: 'intermediate', phone: '+54 11 4444-2222' },
  { ...MOCK_PROFILE, id: 'p5', full_name: 'Ana Flores', level: 'advanced', phone: '+54 9 11 7777-3333' },
  { ...MOCK_PROFILE, id: 'p6', full_name: 'Pedro Torres', level: 'beginner', phone: null },
  MOCK_ADMIN_PROFILE,
];

export const MOCK_NOTIFICATIONS: NotificationLog[] = [
  { id: 'n1', user_id: 'me', type: 'booking_confirmation', sent_at: new Date(TODAY.getTime() - 1 * 3600000).toISOString(), status: 'sent', metadata: {} },
  { id: 'n2', user_id: 'p2', type: 'email_reminder_24h', sent_at: new Date(TODAY.getTime() - 4 * 3600000).toISOString(), status: 'sent', metadata: {} },
  { id: 'n3', user_id: 'p3', type: 'match_prompt', sent_at: new Date(TODAY.getTime() - 8 * 3600000).toISOString(), status: 'failed', metadata: { error: 'Email bounce' } },
  { id: 'n4', user_id: 'p4', type: 'push_1h', sent_at: new Date(TODAY.getTime() - 12 * 3600000).toISOString(), status: 'sent', metadata: {} },
  { id: 'n5', user_id: 'me', type: 'email_reminder_24h', sent_at: new Date(TODAY.getTime() - 24 * 3600000).toISOString(), status: 'sent', metadata: {} },
];
