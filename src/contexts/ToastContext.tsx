import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastSeq = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = toastSeq++;
      setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 3600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-2 pointer-events-none pb-safe"
      >
        {toasts.map((toast) => {
          const styles =
            toast.kind === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/40'
              : toast.kind === 'error'
                ? 'bg-red-700 text-white border-red-400/40'
                : 'bg-slate-900 text-white border-indigo-400/40';

          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-toast-in pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${styles}`}
            >
              {toast.kind === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {toast.kind === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
              )}
              {toast.kind === 'info' && (
                <Info className="w-5 h-5 text-indigo-300 shrink-0" />
              )}
              <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="min-h-[36px] min-w-[36px] -mr-2 flex items-center justify-center rounded-lg text-white/80 hover:text-white active:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
