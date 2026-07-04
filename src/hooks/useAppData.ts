import { useState, useEffect, useCallback } from 'react';
import type { AppData, DaySchedule, WorkoutSession, BodyMetric, Exercise } from '../types';
import { DEFAULT_SCHEDULES } from '../types';
import { db, firebaseReady, ref, set, onValue } from '../lib/firebase';

const STORAGE_KEY = 'forge-gym-data-v1';

function createDefaultData(): AppData {
  return {
    schedules: DEFAULT_SCHEDULES.map((s) => ({ ...s, exercises: [] })),
    sessions: [],
    bodyMetrics: [],
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.schedules?.length) return createDefaultData();
    return parsed;
  } catch {
    return createDefaultData();
  }
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData());
  const [loading, setLoading] = useState(true);

  // Load data from Firebase on mount (if available)
  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const dataRef = ref(db, 'forge-gym-data');
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const firebaseData = snapshot.val();
      if (firebaseData) {
        setData(firebaseData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading from Firebase:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync data to Firebase
  useEffect(() => {
    if (loading || !firebaseReady) return;

    const dataRef = ref(db, 'forge-gym-data');
    set(dataRef, data).catch((error) => {
      console.error('Error syncing to Firebase:', error);
    });
  }, [data, loading]);

  // Also save to localStorage as backup
  useEffect(() => {
    saveData(data);
  }, [data]);

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
    setData((prev) => ({
      ...prev,
      bodyMetrics: prev.bodyMetrics.filter((m) => m.id !== id),
    }));
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
