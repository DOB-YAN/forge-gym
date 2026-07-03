import { useState } from 'react';
import type { DaySchedule, Exercise } from '../types';
import { generateId } from '../utils/dates';

interface ScheduleViewProps {
  schedules: DaySchedule[];
  onAddExercise: (dayKey: string, exercise: Exercise) => void;
  onUpdateExercise: (dayKey: string, exerciseId: string, updates: Partial<Exercise>) => void;
  onRemoveExercise: (dayKey: string, exerciseId: string) => void;
}

export default function ScheduleView({
  schedules,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
}: ScheduleViewProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newSetCount, setNewSetCount] = useState(3);

  const handleAdd = (dayKey: string, currentCount: number) => {
    if (!newName.trim()) return;
    onAddExercise(dayKey, {
      id: generateId(),
      name: newName.trim(),
      pattern: newPattern.trim(),
      setCount: newSetCount,
      order: currentCount,
    });
    setNewName('');
    setNewPattern('');
    setNewSetCount(3);
    setAddingTo(null);
  };

  return (
    <div className="space-y-3 pb-24">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Workout Schedule</h1>
        <p className="text-forge-muted text-sm mt-1">
          Add your exercises for each day. Nothing is pre-filled — build your plan.
        </p>
      </div>

      {schedules.map((day) => (
        <div key={day.dayKey} className="glass-card overflow-hidden">
          <button
            onClick={() => setExpandedDay(expandedDay === day.dayKey ? null : day.dayKey)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold">{day.label}</span>
                {day.isRest && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-forge-border text-forge-muted">
                    REST
                  </span>
                )}
              </div>
              <p className="text-forge-muted text-sm mt-0.5">{day.muscleGroups}</p>
            </div>
            <div className="flex items-center gap-2">
              {!day.isRest && (
                <span className="text-xs text-forge-muted">{day.exercises.length} exercises</span>
              )}
              <span className="text-forge-muted">{expandedDay === day.dayKey ? '▲' : '▼'}</span>
            </div>
          </button>

          {expandedDay === day.dayKey && !day.isRest && (
            <div className="px-4 pb-4 border-t border-forge-border pt-4 space-y-3">
              {day.exercises.length === 0 && addingTo !== day.dayKey && (
                <p className="text-forge-muted text-sm text-center py-4">
                  No exercises yet. Tap below to add your first workout.
                </p>
              )}

              {day.exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-forge-bg rounded-xl p-4 border border-forge-border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-forge-accent text-xs font-semibold">
                        #{idx + 1}
                      </span>
                      <h3 className="font-display font-semibold">{ex.name}</h3>
                    </div>
                    <button
                      onClick={() => onRemoveExercise(day.dayKey, ex.id)}
                      className="text-forge-muted hover:text-red-400 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                  {ex.pattern && (
                    <p className="text-forge-muted text-sm mb-3 italic">Pattern: {ex.pattern}</p>
                  )}
                  <div className="flex gap-3 items-center">
                    <label className="text-xs text-forge-muted">Sets:</label>
                    <select
                      value={ex.setCount}
                      onChange={(e) =>
                        onUpdateExercise(day.dayKey, ex.id, { setCount: Number(e.target.value) })
                      }
                      className="bg-forge-card border border-forge-border rounded-lg px-3 py-1.5 text-sm"
                    >
                      {[2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} sets
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {addingTo === day.dayKey ? (
                <div className="bg-forge-bg rounded-xl p-4 border border-forge-accent/30 space-y-3">
                  <input
                    type="text"
                    placeholder="Exercise name (e.g. Bench Press)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                  <textarea
                    placeholder="Pattern / notes (e.g. 3x10, slow eccentric, pause at bottom)"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    className="input-field min-h-[80px] resize-none"
                    rows={2}
                  />
                  <div className="flex gap-3 items-center">
                    <label className="text-sm text-forge-muted">Number of sets:</label>
                    <select
                      value={newSetCount}
                      onChange={(e) => setNewSetCount(Number(e.target.value))}
                      className="bg-forge-card border border-forge-border rounded-lg px-3 py-2"
                    >
                      {[2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdd(day.dayKey, day.exercises.length)}
                      className="btn-primary flex-1 bg-forge-accent text-white"
                    >
                      Add Exercise
                    </button>
                    <button
                      onClick={() => setAddingTo(null)}
                      className="btn-primary bg-forge-border text-forge-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(day.dayKey)}
                  className="w-full py-3 rounded-xl border border-dashed border-forge-border text-forge-muted hover:border-forge-accent hover:text-forge-accent transition-colors"
                >
                  + Add Exercise
                </button>
              )}
            </div>
          )}

          {expandedDay === day.dayKey && day.isRest && (
            <div className="px-4 pb-4 text-center text-forge-muted text-sm">
              Recovery day — no workouts scheduled.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
