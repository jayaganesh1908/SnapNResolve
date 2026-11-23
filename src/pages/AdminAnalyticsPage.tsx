import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, ClipboardList, RefreshCw, ThumbsUp } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Analytics, Status } from '../types';
import { formatShortDate } from '../utils/format';

const STATUS_COLORS: Record<Status, string> = {
  Reported: '#64748b',
  Assigned: '#2563eb',
  'In Progress': '#d97706',
  Resolved: '#16a34a',
};

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : 'Unable to load analytics.',
          'error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadAnalytics(false);
  }, [loadAnalytics]);

  const resolvedPercent =
    data && data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;

  const perDayFormatted =
    data?.per_day.map((d) => ({
      ...d,
      label: formatShortDate(d.date),
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Campus Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Live breakdown of complaints by category, status, resolution speed, and 14-day trend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing || loading}
          className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top Headline Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total complaints</span>
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {data ? data.total : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {data ? `${data.open} open · ${data.resolved} resolved` : 'Loading...'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total upvotes</span>
            <ThumbsUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-700 mt-2 tabular-nums">
            {data ? data.total_upvotes : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Community priority signals
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Resolution rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
            {data ? `${resolvedPercent}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {data ? `Avg ${data.avg_resolution_hours} hrs to resolve` : 'Loading...'}
          </p>
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-5 h-80 animate-pulse"
            >
              <div className="h-4 w-44 bg-slate-200 rounded mb-6" />
              <div className="h-56 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Complaints by Category (Bar) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Complaints by Category
              </h2>
              <p className="text-xs text-slate-500">
                Volume across the 5 maintenance departments
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.by_category}
                  margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Complaints" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Complaints by Status (Donut) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Complaints by Status
              </h2>
              <p className="text-xs text-slate-500">
                Current workflow distribution
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {data.by_status.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Average Resolution Time in Hours per Category (Bar) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Avg Resolution Time by Category
              </h2>
              <p className="text-xs text-slate-500">
                Mean turnaround time in hours for resolved tickets
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.avg_resolution_by_category}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    unit="h"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [`${val} hrs`, 'Avg Resolution']}
                    contentStyle={{
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" name="Hours" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Complaints per Day - Last 14 Days (Line) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Complaints per Day (Last 14 Days)
              </h2>
              <p className="text-xs text-slate-500">
                Daily submission volume trend across campus
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={perDayFormatted}
                  margin={{ top: 8, right: 16, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval={1}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Complaints"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
