import { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { AppData, DayKey } from '../types';
import { USERS, DAY_ORDER } from '../types';
import { getMaxKg, getTotalReps, formatDisplayDate } from '../utils/dates';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ProgressViewProps {
  data: AppData;
}

export default function ProgressView({ data }: ProgressViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [metric, setMetric] = useState<'maxKg' | 'totalReps' | 'volume'>('maxKg');
  const [viewMode, setViewMode] = useState<'exercise' | 'muscleGroup'>('exercise');

  const schedule = data.schedules.find((s) => s.dayKey === selectedDay);
  const exercises = schedule?.exercises ?? [];

  const activeExerciseId = selectedExercise || exercises[0]?.id || '';

  const chartData = useMemo(() => {
    const sessions = data.sessions
      .filter((s) => s.dayKey === selectedDay)
      .sort((a, b) => a.date.localeCompare(b.date));

    const dates = [...new Set(sessions.map((s) => s.date))].sort();

    return USERS.map((user) => {
      const values = dates.map((date) => {
        const session = sessions.find(
          (s) => s.date === date && s.userId === user.id
        );
        const exLog = session?.exercises.find((e) => e.exerciseId === activeExerciseId);
        if (!exLog) return null;
        if (metric === 'maxKg') return getMaxKg(exLog.sets);
        if (metric === 'totalReps') return getTotalReps(exLog.sets);
        return exLog.sets.reduce(
          (sum, s) => sum + (s.kg ?? 0) * (s.reps ?? 0),
          0
        );
      });

      return { user, dates, values };
    });
  }, [data.sessions, selectedDay, activeExerciseId, metric]);

  const hasData = chartData.some((d) => d.values.some((v) => v != null && v > 0));

  const lineChartData = {
    labels: chartData[0]?.dates.map((d) => formatDisplayDate(d)) ?? [],
    datasets: chartData.map(({ user, values }) => ({
      label: user.name,
      data: values,
      borderColor: user.color,
      backgroundColor: user.color + '20',
      fill: true,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: true,
    })),
  };

  const recentSessions = data.sessions
    .filter((s) => s.dayKey === selectedDay)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  // Muscle group volume data
  const muscleGroupData = useMemo(() => {
    const muscleGroups = data.schedules
      .filter((s) => !s.isRest)
      .map((s) => ({
        dayKey: s.dayKey,
        muscleGroup: s.muscleGroups,
      }));

    const allDates = [...new Set(data.sessions.map((s) => s.date))].sort();

    return muscleGroups.map(({ dayKey, muscleGroup }) => {
      const volumeByUser = USERS.map((user) => {
        const volumes = allDates.map((date) => {
          const session = data.sessions.find(
            (s) => s.date === date && s.dayKey === dayKey && s.userId === user.id
          );
          if (!session) return null;
          return session.exercises.reduce((total, exLog) => {
            return total + exLog.sets.reduce((sum, set) => sum + (set.kg ?? 0) * (set.reps ?? 0), 0);
          }, 0);
        });

        return { user, volumes };
      });

      return {
        muscleGroup,
        dayKey,
        datasets: volumeByUser.map(({ user, volumes }) => ({
          label: `${user.name} - ${muscleGroup}`,
          data: volumes,
          borderColor: user.color,
          backgroundColor: user.color + '20',
          fill: true,
          tension: 0.3,
          spanGaps: true,
        })),
      };
    });
  }, [data.sessions, data.schedules]);

  const hasMuscleGroupData = muscleGroupData.some((mg) => 
    mg.datasets.some((ds) => ds.data.some((v) => v != null && v > 0))
  );

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Progress</h1>
        <p className="text-forge-muted text-sm mt-1">Track your gains over time</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('exercise')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
            viewMode === 'exercise'
              ? 'bg-forge-accent text-white'
              : 'bg-forge-card border border-forge-border text-forge-muted'
          }`}
        >
          By Exercise
        </button>
        <button
          onClick={() => setViewMode('muscleGroup')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
            viewMode === 'muscleGroup'
              ? 'bg-forge-accent text-white'
              : 'bg-forge-card border border-forge-border text-forge-muted'
          }`}
        >
          By Muscle Group
        </button>
      </div>

      {viewMode === 'exercise' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {DAY_ORDER.filter((d) => !data.schedules.find((s) => s.dayKey === d)?.isRest).map(
              (day) => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedExercise('');
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedDay === day
                      ? 'bg-forge-accent text-white'
                      : 'bg-forge-card border border-forge-border text-forge-muted'
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              )
            )}
          </div>

          {exercises.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-forge-muted">Add exercises in Schedule to see progress charts.</p>
            </div>
          ) : (
            <>
              <select
                value={activeExerciseId}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="input-field mb-4"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 mb-4">
                {(['maxKg', 'totalReps', 'volume'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
                      metric === m
                        ? 'bg-forge-border text-white'
                        : 'bg-forge-bg text-forge-muted border border-forge-border'
                    }`}
                  >
                    {m === 'maxKg' ? 'Max KG' : m === 'totalReps' ? 'Total Reps' : 'Volume'}
                  </button>
                ))}
              </div>

              <div className="glass-card p-4 mb-6">
                {hasData ? (
                  <div className="h-64">
                    <Line
                      data={lineChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: '#a1a1aa', font: { family: 'DM Sans' } },
                          },
                        },
                        scales: {
                          x: {
                            ticks: { color: '#71717a', maxRotation: 45 },
                            grid: { color: '#1e1e2e' },
                          },
                          y: {
                            ticks: { color: '#71717a' },
                            grid: { color: '#1e1e2e' },
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-forge-muted text-sm">
                    Log workouts to see your progress graph here.
                  </div>
                )}
              </div>

              <h2 className="font-display font-bold mb-3">Recent Sessions</h2>
              {recentSessions.length === 0 ? (
                <p className="text-forge-muted text-sm">No sessions logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => {
                    const user = USERS.find((u) => u.id === session.userId)!;
                    return (
                      <div
                        key={session.id}
                        className="glass-card p-3 flex justify-between items-center"
                        style={{ borderLeftColor: user.color, borderLeftWidth: 3 }}
                      >
                        <div>
                          <span className="font-semibold text-sm" style={{ color: user.color }}>
                            {user.name}
                          </span>
                          <p className="text-forge-muted text-xs">{formatDisplayDate(session.date)}</p>
                        </div>
                        <span className="text-xs text-forge-muted">
                          {session.exercises.length} exercises logged
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {muscleGroupData.map(({ muscleGroup, dayKey, datasets }) => (
            <div key={dayKey} className="glass-card p-4">
              <h3 className="font-display font-semibold mb-3">{muscleGroup}</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: muscleGroupData[0]?.datasets[0]?.data.map((_, i) => 
                      formatDisplayDate([...new Set(data.sessions.map((s) => s.date))].sort()[i] || '')
                    ) || [],
                    datasets,
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: { color: '#a1a1aa', font: { family: 'DM Sans', size: 11 } },
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: '#71717a', maxRotation: 45 },
                        grid: { color: '#1e1e2e' },
                      },
                      y: {
                        ticks: { color: '#71717a' },
                        grid: { color: '#1e1e2e' },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          ))}
          {!hasMuscleGroupData && (
            <div className="glass-card p-8 text-center">
              <p className="text-forge-muted">Log workouts to see muscle group volume progress.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
