import { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import TodayView from './components/TodayView';
import ScheduleView from './components/ScheduleView';
import ProgressView from './components/ProgressView';
import BodyView from './components/BodyView';
import RestTimer from './components/RestTimer';
import type { UserId } from './types';

type Tab = 'today' | 'schedule' | 'progress' | 'body';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏋️' },
  { id: 'schedule', label: 'Schedule', icon: '📋' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'body', label: 'Body', icon: '⚖️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [activeUser, setActiveUser] = useState<UserId>('abel');
  const [timerOpen, setTimerOpen] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const {
    data,
    addExercise,
    updateExercise,
    removeExercise,
    saveSession,
    addBodyMetric,
    removeBodyMetric,
    exportData,
    importData,
  } = useAppData();

  const handleImport = () => {
    const json = prompt('Paste your backup JSON:');
    if (json && importData(json)) {
      alert('Data restored successfully!');
    } else if (json) {
      alert('Invalid backup data.');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-forge-bg/90 backdrop-blur-xl border-b border-forge-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              <span className="text-forge-accent">FORGE</span>
            </h1>
            <p className="text-forge-muted text-[10px] uppercase tracking-widest">
              Abel & Keneni
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimerOpen(true)}
              className="w-10 h-10 rounded-xl bg-forge-accent/20 text-forge-accent flex items-center justify-center text-lg"
              title="Rest Timer"
            >
              ⏱
            </button>
            <button
              onClick={() => setShowBackup(!showBackup)}
              className="w-10 h-10 rounded-xl bg-forge-border text-forge-muted flex items-center justify-center text-sm"
              title="Backup"
            >
              💾
            </button>
          </div>
        </div>

        {showBackup && (
          <div className="mt-3 p-3 rounded-xl bg-forge-card border border-forge-border animate-slide-up">
            <p className="text-xs text-forge-muted mb-2">
              Backup your data — copy this to save, or import to restore.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportData());
                  alert('Copied to clipboard!');
                }}
                className="flex-1 py-2 rounded-lg bg-forge-abel/20 text-forge-abel text-xs font-semibold"
              >
                Export Copy
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2 rounded-lg bg-forge-kenen/20 text-forge-kenen text-xs font-semibold"
              >
                Import
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pt-4 overflow-y-auto">
        {tab === 'today' && (
          <TodayView
            data={data}
            activeUser={activeUser}
            onUserChange={setActiveUser}
            onSaveSession={saveSession}
            onStartTimer={() => setTimerOpen(true)}
          />
        )}
        {tab === 'schedule' && (
          <ScheduleView
            schedules={data.schedules}
            onAddExercise={addExercise}
            onUpdateExercise={updateExercise}
            onRemoveExercise={removeExercise}
          />
        )}
        {tab === 'progress' && <ProgressView data={data} />}
        {tab === 'body' && (
          <BodyView
            data={data}
            onAddMetric={addBodyMetric}
            onRemoveMetric={removeBodyMetric}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 z-40 bg-forge-bg/95 backdrop-blur-xl border-t border-forge-border px-2 py-2 safe-area-pb">
        <div className="flex justify-around">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`nav-item flex-1 ${tab === t.id ? 'active' : ''}`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <RestTimer isOpen={timerOpen} onClose={() => setTimerOpen(false)} />
    </div>
  );
}
