import { useState, useEffect, useCallback } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuthContext } from '../lib/authContext';

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const EXPECTED = btoa('1965');
const STORAGE_KEY = 'cw_auth';

function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === EXPECTED;
}

function saveAuth() {
  localStorage.setItem(STORAGE_KEY, EXPECTED);
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── PinGate ──────────────────────────────────────────────────────────────────

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed]   = useState(false);
  const [digits, setDigits]   = useState<string[]>([]);
  const [error, setError]     = useState(false);
  const [shake, setShake]     = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(isAuthed());
  }, []);

  const submit = useCallback((pin: string) => {
    if (btoa(pin) === EXPECTED) {
      saveAuth();
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setDigits([]);
        setShake(false);
        setTimeout(() => setError(false), 400);
      }, 600);
    }
  }, []);

  const press = useCallback((d: string) => {
    setError(false);
    setDigits((prev) => {
      if (prev.length >= 4) return prev;
      const next = [...prev, d];
      if (next.length === 4) {
        setTimeout(() => submit(next.join('')), 80);
      }
      return next;
    });
  }, [submit]);

  const del = useCallback(() => {
    setError(false);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const lock = useCallback(() => {
    clearAuth();
    setAuthed(false);
    setDigits([]);
    setError(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    if (authed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      if (e.key === 'Backspace' || e.key === 'Delete') del();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authed, press, del]);

  if (!mounted) return null;

  if (authed) {
    return (
      <AuthContext.Provider value={{ lock }}>
        {children}
      </AuthContext.Provider>
    );
  }

  const DIGIT_KEYS = ['1','2','3','4','5','6','7','8','9','0'] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cw-bg-0">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--cw-border) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.35,
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(66,53,229,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-8 select-none px-4">
        {/* Brand */}
        <div className="text-center">
          <div className="font-display font-bold text-[26px] tracking-[0.14em] text-cw-text-0">
            Zephyron Tech
          </div>
          <div className="font-mono text-[12px] text-cw-text-2 mt-1 tracking-[0.08em] uppercase">
            Price Calculator
          </div>
        </div>

        {/* Card */}
        <div className="bg-cw-bg-2 border border-cw-border rounded-[14px] px-7 py-6 flex flex-col items-center gap-5 w-[300px] shadow-[0_0_60px_rgba(66,53,229,0.15)]">

          <div className="font-sans text-[13px] font-medium tracking-[0.08em] uppercase text-cw-text-2">
            Zadejte PIN
          </div>

          {/* 4-dot display */}
          <div
            className={cn(
              'flex gap-5',
              shake && 'animate-[pin-shake_0.4s_ease-in-out]'
            )}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
                  digits.length > i
                    ? error
                      ? 'bg-cw-red border-cw-red shadow-[0_0_10px_var(--cw-red)]'
                      : 'bg-cw-accent border-cw-accent shadow-[0_0_10px_var(--cw-accent)]'
                    : 'bg-transparent border-cw-border'
                )}
              />
            ))}
          </div>

          {/* Numpad 1-9 */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {DIGIT_KEYS.slice(0, 9).map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                disabled={digits.length >= 4}
                className={cn(
                  'h-[56px] rounded-[10px] font-mono text-[20px] font-semibold',
                  'border border-cw-border bg-cw-bg-3',
                  'hover:bg-cw-bg-1 hover:border-cw-accent',
                  'active:scale-95 active:bg-cw-accent/10',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'transition-all duration-100 cursor-pointer text-cw-text-0'
                )}
              >
                {k}
              </button>
            ))}

            {/* Bottom row: empty, 0, delete */}
            <div />
            <button
              onClick={() => press('0')}
              disabled={digits.length >= 4}
              className={cn(
                'h-[56px] rounded-[10px] font-mono text-[20px] font-semibold',
                'border border-cw-border bg-cw-bg-3',
                'hover:bg-cw-bg-1 hover:border-cw-accent',
                'active:scale-95 active:bg-cw-accent/10',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'transition-all duration-100 cursor-pointer text-cw-text-0'
              )}
            >
              0
            </button>
            <button
              onClick={del}
              className={cn(
                'h-[56px] rounded-[10px]',
                'border border-cw-border bg-cw-bg-3',
                'hover:bg-cw-bg-1 hover:border-cw-red hover:text-cw-red',
                'active:scale-95',
                'transition-all duration-100 cursor-pointer',
                'flex items-center justify-center text-cw-text-2'
              )}
              aria-label="Smazat"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Error hint */}
          <div
            className={cn(
              'font-sans text-[12px] text-cw-red transition-opacity duration-200 -mt-1 h-4',
              error ? 'opacity-100' : 'opacity-0'
            )}
          >
            Nesprávný PIN
          </div>
        </div>

        <div className="font-sans text-[11px] text-cw-text-2/50 tracking-[0.04em]">
          Přístup pouze pro oprávněné uživatele
        </div>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
