import { AlertTriangle, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { Status, Urgency } from '../types';

export function UrgencyBadge({
  urgency,
  score,
}: {
  urgency: Urgency;
  score?: number;
}) {
  const styles: Record<Urgency, string> = {
    High: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    Medium: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 tabular-nums ${styles[urgency]}`}
    >
      {urgency === 'High' && <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{urgency}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono">· {score}</span>
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Reported: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    Assigned: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    'In Progress': 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    Resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${styles[status]}`}
    >
      {status === 'Assigned' && <UserCheck className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {status === 'In Progress' && <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {status === 'Resolved' && <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{status}</span>
    </span>
  );
}
