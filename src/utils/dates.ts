import type { DayKey } from '../types';
import { DAY_ORDER } from '../types';

export function getTodayDayKey(): DayKey {
  const dayIndex = new Date().getDay();
  const map: DayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[dayIndex];
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getLastWeekSameDay(dateStr: string, _dayKey: DayKey): string {
  const current = new Date(dateStr + 'T12:00:00');
  const target = new Date(current);
  target.setDate(target.getDate() - 7);
  return formatDate(target);
}

export function getDayLabel(dayKey: DayKey): string {
  return dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export function getNextDayKey(dayKey: DayKey): DayKey {
  const idx = DAY_ORDER.indexOf(dayKey);
  return DAY_ORDER[(idx + 1) % DAY_ORDER.length];
}

export function getPreviousDayKey(dayKey: DayKey): DayKey {
  const idx = DAY_ORDER.indexOf(dayKey);
  return DAY_ORDER[(idx - 1 + DAY_ORDER.length) % DAY_ORDER.length];
}

export function getBestSetVolume(sets: { kg: number | null; reps: number | null }[]): number {
  return sets.reduce((max, s) => {
    if (s.kg != null && s.reps != null) {
      return Math.max(max, s.kg * s.reps);
    }
    return max;
  }, 0);
}

export function getMaxKg(sets: { kg: number | null; reps: number | null }[]): number {
  return sets.reduce((max, s) => (s.kg != null ? Math.max(max, s.kg) : max), 0);
}

export function getTotalReps(sets: { kg: number | null; reps: number | null }[]): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
}
