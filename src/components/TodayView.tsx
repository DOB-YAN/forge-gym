import { useState, useMemo, useEffect } from 'react';
import type { AppData, UserId, WorkoutSession, SetLog, ExerciseLog } from '../types';
import { getTodayDayKey, formatDate, formatDisplayDate, getLastWeekSameDay, generateId, getMaxKg, getTotalReps } from '../utils/dates';
import UserToggle, { UserBadge } from './UserToggle';

interface TodayViewProps {
  data: AppData;
  activeUser: UserId;
  onUserChange: (user: UserId) => void;
  onSaveSession: (session: WorkoutSession) => void;
  onStartTimer: () => void;
}

function createEmptySets(count: number): SetLog[] {
  return Array.from({ length: count }, () => ({ kg: null, reps: null }));
}

export default function TodayView({
  data,
  activeUser,
  onUserChange,
  onSaveSession,
  onStartTimer,
}: TodayViewProps) {
  const todayKey = getTodayDayKey();
  const todayDate = formatDate();
  const schedule = data.schedules.find((s) => s.dayKey === todayKey)!;
  const lastWeekDate = getLastWeekSameDay(todayDate, todayKey);

  const existingSession = data.sessions.find(
    (s) => s.date === todayDate && s.dayKey === todayKey && s.userId === activeUser
  );

  const lastWeekSession = data.sessions.find(
    (s) => s.date === lastWeekDate && s.dayKey === todayKey && s.userId === activeUser
  );

  const [logs, setLogs] = useState<ExerciseLog[]>(() => {
    if (existingSession) return existingSession.exercises;
    return schedule.exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: createEmptySets(ex.setCount),
    }));
  });

  useEffect(() => {
    if (existingSession) {
      setLogs(existingSession.exercises);
    } else {
      setLogs(
        schedule.exercises.map((ex) => ({
          exerciseId: ex.id,
          sets: createEmptySets(ex.setCount),
        }))
      );
    }
  }, [activeUser, todayKey, existingSession, schedule.exercises]);

  const updateSet = (exerciseId: string, setIndex: number, field: 'kg' | 'reps', value: string) => {
    const num = value === '' ? null : Number(value);
    setLogs((prev) =>
      prev.map((log) =>
        log.exerciseId === exerciseId
          ? {
              ...log,
              sets: log.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: num } : s
              ),
            }
          : log
      )
    );
  };

  const handleSave = () => {
    const session: WorkoutSession = {
      id: existingSession?.id ?? generateId(),
      date: todayDate,
      dayKey: todayKey,
      userId: activeUser,
      exercises: logs,
      completed: true,
    };
    onSaveSession(session);
  };

  const lastWeekMap = useMemo(() => {
    const map = new Map<string, ExerciseLog>();
    lastWeekSession?.exercises.forEach((e) => map.set(e.exerciseId, e));
    return map;
  }, [lastWeekSession]);

  if (schedule.isRest) {
    return (
      <div className="pb-24">
        <Header todayDate={todayDate} schedule={schedule} />
        <UserToggle activeUser={activeUser} onChange={onUserChange} />
        <div className="glass-card p-8 mt-6 text-center">
          <div className="text-5xl mb-4">😴</div>
          <h2 className="font-display text-xl font-bold mb-2">Rest Day</h2>
          <p className="text-forge-muted">
            Today is {schedule.label} — take it easy and recover.
          </p>
          <p className="text-forge-muted text-sm mt-4">
            Light stretching or a walk is fine. See you on{' '}
            {data.schedules.find((s) => !s.isRest && s.dayKey !== todayKey)?.label ?? 'the next training day'}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Header todayDate={todayDate} schedule={schedule} />

      <div className="mb-4">
        <UserToggle activeUser={activeUser} onChange={onUserChange} />
      </div>

      {lastWeekSession && (
        <div className="glass-card p-4 mb-4 border-l-4 border-forge-accent">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-forge-accent text-sm font-semibold">📊 Last Week Target</span>
            <UserBadge userId={activeUser} />
          </div>
          <p className="text-forge-muted text-sm">
            {formatDisplayDate(lastWeekDate)} — beat these numbers today!
          </p>
        </div>
      )}

      {schedule.exercises.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">🏋️</div>
          <h2 className="font-display font-bold mb-2">No Exercises Yet</h2>
          <p className="text-forge-muted text-sm">
            Go to the Schedule tab and add your workouts for {schedule.label} first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.exercises.map((exercise, exIdx) => {
            const log = logs.find((l) => l.exerciseId === exercise.id);
            const lastWeekLog = lastWeekMap.get(exercise.id);
            const sets = log?.sets ?? createEmptySets(exercise.setCount);

            return (
              <div key={exercise.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-forge-accent text-xs font-bold">#{exIdx + 1}</span>
                    <h3 className="font-display font-bold text-lg">{exercise.name}</h3>
                  </div>
                  <button
                    onClick={onStartTimer}
                    className="text-xs px-3 py-1.5 rounded-lg bg-forge-accent/20 text-forge-accent font-semibold"
                  >
                    ⏱ Rest
                  </button>
                </div>

                {exercise.pattern && (
                  <p className="text-forge-muted text-sm mb-3 bg-forge-bg rounded-lg p-2 italic">
                    {exercise.pattern}
                  </p>
                )}

                {lastWeekLog && (
                  <div className="mb-3 p-2 rounded-lg bg-forge-bg border border-forge-border">
                    <p className="text-xs text-forge-muted mb-1">Last week minimum to beat:</p>
                    <div className="flex flex-wrap gap-2">
                      {lastWeekLog.sets.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded bg-forge-abel-dim/30 text-forge-abel"
                        >
                          Set {i + 1}: {s.kg ?? '—'}kg × {s.reps ?? '—'} reps
                        </span>
                      ))}
                      <span className="text-xs px-2 py-1 rounded bg-forge-accent/20 text-forge-accent font-semibold">
                        Max: {getMaxKg(lastWeekLog.sets)}kg · {getTotalReps(lastWeekLog.sets)} total reps
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-xs text-forge-muted px-1">
                    <span className="w-12">Set</span>
                    <span>KG</span>
                    <span>Reps</span>
                  </div>
                  {sets.map((set, setIdx) => {
                    const lastSet = lastWeekLog?.sets[setIdx];
                    const belowLastWeek =
                      lastSet &&
                      ((set.kg != null && lastSet.kg != null && set.kg < lastSet.kg) ||
                        (set.reps != null && lastSet.reps != null && set.reps < lastSet.reps));

                    return (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-[auto_1fr_1fr] gap-2 items-center ${
                          belowLastWeek ? 'opacity-100' : ''
                        }`}
                      >
                        <span className="w-12 text-sm font-semibold text-forge-muted">
                          {setIdx + 1}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder={lastSet?.kg?.toString() ?? 'kg'}
                          value={set.kg ?? ''}
                          onChange={(e) =>
                            updateSet(exercise.id, setIdx, 'kg', e.target.value)
                          }
                          className={`input-field py-2 text-center ${
                            belowLastWeek ? 'border-red-500/50' : ''
                          } ${
                            set.kg != null &&
                            lastSet?.kg != null &&
                            set.kg >= lastSet.kg
                              ? 'border-forge-kenen/50'
                              : ''
                          }`}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder={lastSet?.reps?.toString() ?? 'reps'}
                          value={set.reps ?? ''}
                          onChange={(e) =>
                            updateSet(exercise.id, setIdx, 'reps', e.target.value)
                          }
                          className={`input-field py-2 text-center ${
                            belowLastWeek ? 'border-red-500/50' : ''
                          } ${
                            set.reps != null &&
                            lastSet?.reps != null &&
                            set.reps >= lastSet.reps
                              ? 'border-forge-kenen/50'
                              : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button
            onClick={handleSave}
            className="btn-primary w-full bg-gradient-to-r from-forge-abel to-forge-kenen text-white font-display font-bold text-lg py-4 shadow-lg"
          >
            💾 Save Today's Workout
          </button>

          {existingSession && (
            <p className="text-center text-forge-kenen text-sm">
              ✓ Saved for today — last updated session on file
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Header({
  todayDate,
  schedule,
}: {
  todayDate: string;
  schedule: { label: string; muscleGroups: string };
}) {
  return (
    <div className="mb-6">
      <p className="text-forge-accent text-sm font-semibold uppercase tracking-wider">
        {formatDisplayDate(todayDate)}
      </p>
      <h1 className="font-display text-3xl font-bold mt-1">{schedule.label}</h1>
      <p className="text-forge-muted mt-1">{schedule.muscleGroups}</p>
    </div>
  );
}
