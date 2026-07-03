export type UserId = 'abel' | 'keneni';

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface SetLog {
  kg: number | null;
  reps: number | null;
}

export interface Exercise {
  id: string;
  name: string;
  pattern: string;
  setCount: number;
  order: number;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  dayKey: DayKey;
  userId: UserId;
  exercises: ExerciseLog[];
  completed: boolean;
}

export interface BodyMetric {
  id: string;
  date: string;
  userId: UserId;
  weightKg: number | null;
  heightCm: number | null;
}

export interface DaySchedule {
  dayKey: DayKey;
  label: string;
  muscleGroups: string;
  isRest: boolean;
  exercises: Exercise[];
}

export interface AppData {
  schedules: DaySchedule[];
  sessions: WorkoutSession[];
  bodyMetrics: BodyMetric[];
}

export const USERS: { id: UserId; name: string; color: string; colorClass: string }[] = [
  { id: 'abel', name: 'ABEL', color: '#3b82f6', colorClass: 'text-forge-abel' },
  { id: 'keneni', name: 'KENENI', color: '#22c55e', colorClass: 'text-forge-kenen' },
];

export const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DEFAULT_SCHEDULES: Omit<DaySchedule, 'exercises'>[] = [
  { dayKey: 'monday', label: 'Monday', muscleGroups: 'Chest · Shoulders · Biceps', isRest: false },
  { dayKey: 'tuesday', label: 'Tuesday', muscleGroups: 'Back · Biceps · Forearm', isRest: false },
  { dayKey: 'wednesday', label: 'Wednesday', muscleGroups: 'Rest Day', isRest: true },
  { dayKey: 'thursday', label: 'Thursday', muscleGroups: 'Arms — Biceps · Triceps · Forearm · Shoulders', isRest: false },
  { dayKey: 'friday', label: 'Friday', muscleGroups: 'Chest · Back', isRest: false },
  { dayKey: 'saturday', label: 'Saturday', muscleGroups: 'Leg Day', isRest: false },
  { dayKey: 'sunday', label: 'Sunday', muscleGroups: 'Rest Day', isRest: true },
];
