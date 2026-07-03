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
import type { AppData, UserId, BodyMetric } from '../types';
import { USERS } from '../types';
import { formatDate, formatDisplayDate, generateId } from '../utils/dates';
import UserToggle from './UserToggle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface BodyViewProps {
  data: AppData;
  onAddMetric: (metric: BodyMetric) => void;
  onRemoveMetric: (id: string) => void;
}

export default function BodyView({ data, onAddMetric, onRemoveMetric }: BodyViewProps) {
  const [activeUser, setActiveUser] = useState<UserId>('abel');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [showBoth, setShowBoth] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metric: BodyMetric = {
      id: generateId(),
      date: formatDate(),
      userId: activeUser,
      weightKg: weight ? Number(weight) : null,
      heightCm: height ? Number(height) : null,
    };
    onAddMetric(metric);
    setWeight('');
    setHeight('');
  };

  const chartData = useMemo(() => {
    const allDates = [
      ...new Set(data.bodyMetrics.map((m) => m.date)),
    ].sort();

    const usersToShow = showBoth ? USERS : USERS.filter((u) => u.id === activeUser);

    return {
      labels: allDates.map((d) => formatDisplayDate(d)),
      weightDatasets: usersToShow.map((user) => ({
        label: `${user.name} Weight (kg)`,
        data: allDates.map((date) => {
          const m = data.bodyMetrics.find(
            (bm) => bm.date === date && bm.userId === user.id
          );
          return m?.weightKg ?? null;
        }),
        borderColor: user.color,
        backgroundColor: user.color + '20',
        fill: false,
        tension: 0.3,
        spanGaps: true,
      })),
      heightDatasets: usersToShow.map((user) => ({
        label: `${user.name} Height (cm)`,
        data: allDates.map((date) => {
          const m = data.bodyMetrics.find(
            (bm) => bm.date === date && bm.userId === user.id
          );
          return m?.heightCm ?? null;
        }),
        borderColor: user.color,
        backgroundColor: user.color + '10',
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        spanGaps: true,
      })),
    };
  }, [data.bodyMetrics, showBoth, activeUser]);

  const userMetrics = data.bodyMetrics
    .filter((m) => m.userId === activeUser)
    .sort((a, b) => b.date.localeCompare(a.date));

  const latestWeight = userMetrics.find((m) => m.weightKg != null);
  const latestHeight = userMetrics.find((m) => m.heightCm != null);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#a1a1aa', font: { family: 'DM Sans', size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#71717a', maxRotation: 45 }, grid: { color: '#1e1e2e' } },
      y: { ticks: { color: '#71717a' }, grid: { color: '#1e1e2e' } },
    },
  };

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Body Metrics</h1>
        <p className="text-forge-muted text-sm mt-1">
          Log weight & height weekly — optional but great for tracking
        </p>
      </div>

      <UserToggle activeUser={activeUser} onChange={setActiveUser} />

      <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-forge-muted text-xs uppercase">Latest Weight</p>
          <p className="font-display text-2xl font-bold mt-1" style={{ color: USERS.find(u => u.id === activeUser)?.color }}>
            {latestWeight?.weightKg ?? '—'} <span className="text-sm text-forge-muted">kg</span>
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-forge-muted text-xs uppercase">Latest Height</p>
          <p className="font-display text-2xl font-bold mt-1" style={{ color: USERS.find(u => u.id === activeUser)?.color }}>
            {latestHeight?.heightCm ?? '—'} <span className="text-sm text-forge-muted">cm</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-4 mb-6 space-y-3">
        <h3 className="font-display font-semibold">Log Today</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-forge-muted mb-1 block">Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="e.g. 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-forge-muted mb-1 block">Height (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="e.g. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <p className="text-xs text-forge-muted">Leave blank anything you didn't measure today.</p>
        <button
          type="submit"
          disabled={!weight && !height}
          className="btn-primary w-full bg-forge-accent text-white disabled:opacity-40"
        >
          Save Entry
        </button>
      </form>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold">Trends</h3>
        <button
          onClick={() => setShowBoth(!showBoth)}
          className="text-xs px-3 py-1 rounded-lg bg-forge-border text-forge-muted"
        >
          {showBoth ? 'Both users' : 'Single user'}
        </button>
      </div>

      {data.bodyMetrics.length > 0 ? (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <p className="text-sm text-forge-muted mb-2">Weight over time</p>
            <div className="h-52">
              <Line data={{ labels: chartData.labels, datasets: chartData.weightDatasets }} options={chartOptions} />
            </div>
          </div>
          {chartData.heightDatasets.some((d) => d.data.some((v) => v != null)) && (
            <div className="glass-card p-4">
              <p className="text-sm text-forge-muted mb-2">Height over time</p>
              <div className="h-52">
                <Line data={{ labels: chartData.labels, datasets: chartData.heightDatasets }} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-forge-muted text-sm">
          No body metrics logged yet. Add your first entry above.
        </div>
      )}

      {userMetrics.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display font-semibold mb-3">History</h3>
          <div className="space-y-2">
            {userMetrics.slice(0, 8).map((m) => (
              <div key={m.id} className="glass-card p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">{formatDisplayDate(m.date)}</p>
                  <p className="text-xs text-forge-muted">
                    {m.weightKg != null ? `${m.weightKg} kg` : '—'} ·{' '}
                    {m.heightCm != null ? `${m.heightCm} cm` : '—'}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveMetric(m.id)}
                  className="text-forge-muted hover:text-red-400 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
