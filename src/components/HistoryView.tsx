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
import type { AppData, UserId } from '../types';
import { USERS } from '../types';
import { formatDisplayDate, getDaysAgo } from '../utils/dates';
import UserToggle from './UserToggle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface HistoryViewProps {
  data: AppData;
}

export default function HistoryView({ data }: HistoryViewProps) {
  const [activeUser, setActiveUser] = useState<UserId>('abel');
  const [showGraphs, setShowGraphs] = useState(false);

  // Get sessions from the past 30 days
  const recentSessions = useMemo(() => {
    const thirtyDaysAgo = getDaysAgo(30);
    return data.sessions
      .filter((s) => s.date >= thirtyDaysAgo && s.userId === activeUser)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.sessions, activeUser]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, typeof recentSessions> = {};
    recentSessions.forEach((session) => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    return grouped;
  }, [recentSessions]);

  // Calculate daily totals for the graph
  const workoutProgressData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = getDaysAgo(29 - i);
      return date;
    });

    const totalKg = last30Days.map((date) => {
      const daySessions = recentSessions.filter((s) => s.date === date);
      let total = 0;
      daySessions.forEach((session) => {
        session.exercises.forEach((ex) => {
          ex.sets.forEach((set) => {
            if (set.kg) total += set.kg;
          });
        });
      });
      return total;
    });

    const totalReps = last30Days.map((date) => {
      const daySessions = recentSessions.filter((s) => s.date === date);
      let total = 0;
      daySessions.forEach((session) => {
        session.exercises.forEach((ex) => {
          ex.sets.forEach((set) => {
            if (set.reps) total += set.reps;
          });
        });
      });
      return total;
    });

    return {
      labels: last30Days.map((d) => formatDisplayDate(d)),
      totalKg,
      totalReps,
    };
  }, [recentSessions]);

  // Body metrics progress
  const bodyProgressData = useMemo(() => {
    const userMetrics = data.bodyMetrics
      .filter((m) => m.userId === activeUser)
      .sort((a, b) => a.date.localeCompare(b.date));

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = getDaysAgo(29 - i);
      return date;
    });

    const weightData = last30Days.map((date) => {
      const metric = userMetrics.find((m) => m.date === date);
      return metric?.weightKg ?? null;
    });

    const heightData = last30Days.map((date) => {
      const metric = userMetrics.find((m) => m.date === date);
      return metric?.heightCm ?? null;
    });

    return {
      labels: last30Days.map((d) => formatDisplayDate(d)),
      weightData,
      heightData,
    };
  }, [data.bodyMetrics, activeUser]);

  const user = USERS.find((u) => u.id === activeUser)!;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#a1a1aa', font: { family: 'DM Sans' } } },
    },
    scales: {
      x: { ticks: { color: '#71717a', maxRotation: 45 }, grid: { color: '#1e1e2e' } },
      y: { ticks: { color: '#71717a' }, grid: { color: '#1e1e2e' }, beginAtZero: true },
    },
  };

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">History</h1>
        <p className="text-forge-muted text-sm mt-1">Your workout history from the past month</p>
      </div>

      <UserToggle activeUser={activeUser} onChange={setActiveUser} />

      <div className="mt-4 mb-6">
        <button
          onClick={() => setShowGraphs(!showGraphs)}
          className="w-full py-3 rounded-xl bg-forge-card border border-forge-border text-sm font-semibold flex items-center justify-center gap-2"
        >
          {showGraphs ? '📋 Show Workout List' : '📈 Show Progress Graphs'}
        </button>
      </div>

      {!showGraphs ? (
        <>
          {recentSessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-forge-muted">No workouts logged in the past 30 days.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(sessionsByDate).map(([date, sessions]) => (
                <div key={date} className="glass-card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display font-semibold">{formatDisplayDate(date)}</h3>
                    <span className="text-xs text-forge-muted">{sessions.length} workout(s)</span>
                  </div>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="bg-forge-bg/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold uppercase text-forge-muted">
                            {session.dayKey}
                          </span>
                          <span className="text-xs" style={{ color: user.color }}>
                            {session.exercises.length} exercises
                          </span>
                        </div>
                        <div className="space-y-1">
                          {session.exercises.map((exLog) => {
                            const exercise = data.schedules
                              .find((s) => s.dayKey === session.dayKey)
                              ?.exercises.find((e) => e.id === exLog.exerciseId);
                            if (!exercise) return null;
                            
                            const completedSets = exLog.sets.filter((s) => s.kg != null || s.reps != null);
                            const maxKg = Math.max(...exLog.sets.map((s) => s.kg ?? 0));
                            const totalReps = exLog.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);

                            return (
                              <div key={exLog.exerciseId} className="text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{exercise.name}</span>
                                  <span className="text-xs text-forge-muted">
                                    {maxKg > 0 ? `${maxKg}kg` : ''} {totalReps > 0 ? `· ${totalReps} reps` : ''}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {exLog.sets.map((set, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded bg-forge-border text-forge-muted"
                                    >
                                      {set.kg ?? '—'}kg × {set.reps ?? '—'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-4">
            <h3 className="font-display font-semibold mb-3">Weight Progress (Last 30 Days)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: workoutProgressData.labels,
                  datasets: [
                    {
                      label: 'Total Weight (kg)',
                      data: workoutProgressData.totalKg,
                      borderColor: user.color,
                      backgroundColor: user.color + '20',
                      fill: true,
                      tension: 0.3,
                      spanGaps: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-display font-semibold mb-3">Reps Progress (Last 30 Days)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: workoutProgressData.labels,
                  datasets: [
                    {
                      label: 'Total Reps',
                      data: workoutProgressData.totalReps,
                      borderColor: user.color,
                      backgroundColor: user.color + '20',
                      fill: true,
                      tension: 0.3,
                      spanGaps: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-display font-semibold mb-3">Body Weight Progress (Last 30 Days)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: bodyProgressData.labels,
                  datasets: [
                    {
                      label: 'Weight (kg)',
                      data: bodyProgressData.weightData,
                      borderColor: user.color,
                      backgroundColor: user.color + '20',
                      fill: true,
                      tension: 0.3,
                      spanGaps: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-display font-semibold mb-3">Body Height Progress (Last 30 Days)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: bodyProgressData.labels,
                  datasets: [
                    {
                      label: 'Height (cm)',
                      data: bodyProgressData.heightData,
                      borderColor: user.color,
                      backgroundColor: user.color + '10',
                      borderDash: [5, 5],
                      fill: false,
                      tension: 0.3,
                      spanGaps: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
