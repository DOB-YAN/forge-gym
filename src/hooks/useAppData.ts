import { useState, useEffect, useCallback } from 'react';
import type { AppData, DaySchedule, WorkoutSession, BodyMetric, Exercise } from '../types';
import { DEFAULT_SCHEDULES } from '../types';
import { supabase } from '../lib/supabase';

function createDefaultData(): AppData {
  return {
    schedules: DEFAULT_SCHEDULES.map((s) => ({ ...s, exercises: [] })),
    sessions: [],
    bodyMetrics: [],
  };
}

export function useAppData() {
  const [data, setData] = useState<AppData>(createDefaultData());
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const [schedulesRes, sessionsRes, bodyMetricsRes] = await Promise.all([
          supabase.from('schedules').select('*'),
          supabase.from('sessions').select('*').order('date', { ascending: true }),
          supabase.from('body_metrics').select('*').order('date', { ascending: true }),
        ]);

        if (schedulesRes.error) throw schedulesRes.error;
        if (sessionsRes.error) throw sessionsRes.error;
        if (bodyMetricsRes.error) throw bodyMetricsRes.error;

        const schedules = schedulesRes.data.map((s) => ({
          dayKey: s.day_key,
          label: s.label,
          muscleGroups: s.muscle_groups,
          isRest: s.is_rest,
          exercises: s.exercises,
        }));

        const sessions = sessionsRes.data.map((s) => ({
          id: s.id,
          date: s.date,
          dayKey: s.day_key,
          userId: s.user_id,
          exercises: s.exercises,
          completed: s.completed,
        }));

        const bodyMetrics = bodyMetricsRes.data.map((m) => ({
          id: m.id,
          date: m.date,
          userId: m.user_id,
          weightKg: m.weight_kg,
          heightCm: m.height_cm,
        }));

        setData({
          schedules: schedules.length > 0 ? schedules : createDefaultData().schedules,
          sessions,
          bodyMetrics,
        });
      } catch (error) {
        console.error('Error loading from Supabase:', error);
        // Fallback to default data if Supabase fails
        setData(createDefaultData());
      } finally {
        setLoading(false);
      }
    }

    loadFromSupabase();
  }, []);

  // Sync schedules to Supabase
  useEffect(() => {
    if (loading) return;

    async function syncSchedules() {
      try {
        for (const schedule of data.schedules) {
          const { error } = await supabase
            .from('schedules')
            .upsert({
              day_key: schedule.dayKey,
              label: schedule.label,
              muscle_groups: schedule.muscleGroups,
              is_rest: schedule.isRest,
              exercises: schedule.exercises,
            }, {
              onConflict: 'day_key'
            });

          if (error) console.error('Error syncing schedule:', error);
        }
      } catch (error) {
        console.error('Error syncing schedules:', error);
      }
    }

    syncSchedules();
  }, [data.schedules, loading]);

  // Sync sessions to Supabase
  useEffect(() => {
    if (loading) return;

    async function syncSessions() {
      try {
        for (const session of data.sessions) {
          const { error } = await supabase
            .from('sessions')
            .upsert({
              id: session.id,
              date: session.date,
              day_key: session.dayKey,
              user_id: session.userId,
              exercises: session.exercises,
              completed: session.completed,
            }, {
              onConflict: 'id'
            });

          if (error) console.error('Error syncing session:', error);
        }
      } catch (error) {
        console.error('Error syncing sessions:', error);
      }
    }

    syncSessions();
  }, [data.sessions, loading]);

  // Sync body metrics to Supabase
  useEffect(() => {
    if (loading) return;

    async function syncBodyMetrics() {
      try {
        for (const metric of data.bodyMetrics) {
          const { error } = await supabase
            .from('body_metrics')
            .upsert({
              id: metric.id,
              date: metric.date,
              user_id: metric.userId,
              weight_kg: metric.weightKg,
              height_cm: metric.heightCm,
            }, {
              onConflict: 'id'
            });

          if (error) console.error('Error syncing body metric:', error);
        }
      } catch (error) {
        console.error('Error syncing body metrics:', error);
      }
    }

    syncBodyMetrics();
  }, [data.bodyMetrics, loading]);

  const updateSchedule = useCallback((dayKey: string, updater: (s: DaySchedule) => DaySchedule) => {
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.dayKey === dayKey ? updater(s) : s)),
    }));
  }, []);

  const addExercise = useCallback((dayKey: string, exercise: Exercise) => {
    updateSchedule(dayKey, (s) => ({
      ...s,
      exercises: [...s.exercises, exercise].sort((a, b) => a.order - b.order),
    }));
  }, [updateSchedule]);

  const updateExercise = useCallback((dayKey: string, exerciseId: string, updates: Partial<Exercise>) => {
    updateSchedule(dayKey, (s) => ({
      ...s,
      exercises: s.exercises
        .map((e) => (e.id === exerciseId ? { ...e, ...updates } : e))
        .sort((a, b) => a.order - b.order),
    }));
  }, [updateSchedule]);

  const removeExercise = useCallback((dayKey: string, exerciseId: string) => {
    updateSchedule(dayKey, (s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.id !== exerciseId),
    }));
  }, [updateSchedule]);

  const saveSession = useCallback((session: WorkoutSession) => {
    setData((prev) => {
      const filtered = prev.sessions.filter(
        (s) => !(s.date === session.date && s.dayKey === session.dayKey && s.userId === session.userId)
      );
      return { ...prev, sessions: [...filtered, session] };
    });
  }, []);

  const addBodyMetric = useCallback((metric: BodyMetric) => {
    setData((prev) => ({
      ...prev,
      bodyMetrics: [...prev.bodyMetrics.filter((m) => m.id !== metric.id), metric],
    }));
  }, []);

  const removeBodyMetric = useCallback((id: string) => {
    setData((prev) => {
      // Delete from Supabase
      supabase.from('body_metrics').delete().eq('id', id);
      
      return {
        ...prev,
        bodyMetrics: prev.bodyMetrics.filter((m) => m.id !== id),
      };
    });
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as AppData;
      if (parsed.schedules && parsed.sessions) {
        setData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    data,
    loading,
    updateSchedule,
    addExercise,
    updateExercise,
    removeExercise,
    saveSession,
    addBodyMetric,
    removeBodyMetric,
    exportData,
    importData,
  };
}
