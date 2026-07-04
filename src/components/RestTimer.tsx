import { useState, useEffect, useRef, useCallback } from 'react';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function RestTimer({ isOpen, onClose, duration = 60 }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setSecondsLeft(duration);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [duration]);

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const playPleasantSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      
      // Create a pleasant chord (C major)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        // Envelope for pleasant sound
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + 0.6);
      });
    } catch {
      /* audio optional */
    }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      playPleasantSound();
    }
  }, [secondsLeft, isRunning, playPleasantSound]);

  if (!isOpen) return null;

  const progress = ((duration - secondsLeft) / duration) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-50 animate-slide-up">
        <div className="glass-card p-3 flex items-center gap-3 shadow-lg">
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e1e2e" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#f97316"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.827} 282.7`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-sm font-bold tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-forge-muted hover:text-white text-sm font-medium"
          >
            Expand
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-forge-border flex items-center justify-center text-forge-muted hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-slide-up">
      <div className="glass-card w-full max-w-md mx-4 mb-4 sm:mb-0 p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl font-bold">Rest Timer</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-10 h-10 rounded-full bg-forge-border flex items-center justify-center text-forge-muted hover:text-white"
              title="Minimize"
            >
              −
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-forge-border flex items-center justify-center text-forge-muted hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e1e2e" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f97316"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.827} 282.7`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-bold tabular-nums">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <span className="text-forge-muted text-sm mt-1">remaining</span>
          </div>
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="btn-primary flex-1 bg-forge-accent text-white"
            >
              {secondsLeft < duration ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="btn-primary flex-1 bg-forge-border text-white"
            >
              Pause
            </button>
          )}
          <button onClick={reset} className="btn-primary bg-forge-border text-forge-muted px-4">
            Reset
          </button>
        </div>

        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {[30, 60, 90, 120, 240, 300].map((d) => {
            const label = d >= 60 ? `${d / 60}m` : `${d}s`;
            return (
              <button
                key={d}
                onClick={() => {
                  setSecondsLeft(d);
                  setIsRunning(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  duration === d && secondsLeft === d
                    ? 'bg-forge-accent/20 text-forge-accent'
                    : 'bg-forge-border text-forge-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
