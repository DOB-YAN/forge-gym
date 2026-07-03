import type { UserId } from '../types';
import { USERS } from '../types';

interface UserToggleProps {
  activeUser: UserId;
  onChange: (user: UserId) => void;
}

export default function UserToggle({ activeUser, onChange }: UserToggleProps) {
  return (
    <div className="flex gap-2 p-1 bg-forge-bg rounded-xl border border-forge-border">
      {USERS.map((user) => (
        <button
          key={user.id}
          onClick={() => onChange(user.id)}
          className={`flex-1 py-2.5 px-4 rounded-lg font-display font-semibold text-sm transition-all ${
            activeUser === user.id
              ? user.id === 'abel'
                ? 'bg-forge-abel text-white shadow-lg shadow-forge-abel/30'
                : 'bg-forge-kenen text-white shadow-lg shadow-forge-kenen/30'
              : 'text-forge-muted hover:text-white'
          }`}
        >
          {user.name}
        </button>
      ))}
    </div>
  );
}

export function UserBadge({ userId, size = 'sm' }: { userId: UserId; size?: 'sm' | 'md' }) {
  const user = USERS.find((u) => u.id === userId)!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display font-semibold ${
        size === 'md' ? 'text-sm' : 'text-xs'
      }`}
      style={{ color: user.color }}
    >
      <span
        className={`rounded-full ${size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: user.color }}
      />
      {user.name}
    </span>
  );
}
