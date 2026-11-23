import { Check } from 'lucide-react';
import { Status } from '../types';
import { STATUSES } from '../utils/format';

export function StatusTracker({
  status,
  compact = false,
}: {
  status: Status;
  compact?: boolean;
}) {
  const currentIndex = STATUSES.indexOf(status);

  return (
    <div className="w-full" aria-label={`Status progress: ${status}`}>
      <div className="relative flex items-start justify-between">
        {/* Background track line */}
        <div
          className={`absolute left-4 right-4 ${compact ? 'top-3' : 'top-3.5'} h-0.5 bg-slate-200`}
          aria-hidden="true"
        />
        {/* Active progress line */}
        <div
          className={`absolute left-4 ${compact ? 'top-3' : 'top-3.5'} h-0.5 bg-indigo-600 transition-all duration-200`}
          style={{
            width:
              currentIndex === 0
                ? '0%'
                : `calc(${(currentIndex / (STATUSES.length - 1)) * 100}% - 1.5rem)`,
          }}
          aria-hidden="true"
        />

        {STATUSES.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isResolvedCurrent = isCurrent && step === 'Resolved';

          const circleClass = isResolvedCurrent
            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
            : isCurrent
              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
              : isCompleted
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-400 border-2 border-slate-200';

          const labelClass = isResolvedCurrent
            ? 'text-emerald-700 font-semibold'
            : isCurrent
              ? 'text-indigo-700 font-semibold'
              : isCompleted
                ? 'text-slate-700 font-medium'
                : 'text-slate-400';

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center text-center flex-1 min-w-0"
            >
              <div
                className={`${compact ? 'w-6 h-6 text-[11px]' : 'w-7 h-7 text-xs'} rounded-full flex items-center justify-center font-semibold transition-colors ${circleClass}`}
              >
                {isCompleted || isResolvedCurrent ? (
                  <Check className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2.5} />
                ) : (
                  <span className="tabular-nums">{idx + 1}</span>
                )}
              </div>
              <span
                className={`${compact ? 'text-[11px] mt-1.5' : 'text-xs mt-2'} leading-tight truncate max-w-full px-0.5 ${labelClass}`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
