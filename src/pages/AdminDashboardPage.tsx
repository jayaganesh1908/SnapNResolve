import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderOpen,
  RefreshCw,
  Search,
  ThumbsUp,
  X,
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { PhotoBox } from '../components/PhotoBox';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Analytics, Category, Complaint, Status, Urgency } from '../types';
import {
  BUILDINGS,
  CATEGORIES,
  STATUSES,
  URGENCIES,
  formatLocation,
  formatTicketCode,
  timeAgo,
} from '../utils/format';

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | ''>('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      try {
        const [stats, list] = await Promise.all([
          api.getAnalytics(),
          api.listComplaints({
            status: statusFilter,
            category: categoryFilter,
            urgency: urgencyFilter,
            building: buildingFilter,
            search,
            sort: 'priority',
          }),
        ]);
        setAnalytics(stats);
        setComplaints(list);
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : 'Unable to load dashboard data.',
          'error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, categoryFilter, urgencyFilter, buildingFilter, search, showToast]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const hasFilters = Boolean(
    statusFilter || categoryFilter || urgencyFilter || buildingFilter || search.trim()
  );

  function resetFilters() {
    setStatusFilter('');
    setCategoryFilter('');
    setUrgencyFilter('');
    setBuildingFilter('');
    setSearch('');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Complaints sorted by AI priority score (urgency + 5 × upvotes).
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Open complaints</span>
            <FolderOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {analytics ? analytics.open : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {analytics ? `of ${analytics.total} total` : 'Loading...'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">High urgency open</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2 tabular-nums">
            {analytics ? analytics.high_open : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Needs immediate dispatch</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Resolved this week</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
            {analytics ? analytics.resolved_this_week : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Closed with photo proof</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Avg resolution time</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {analytics ? `${analytics.avg_resolution_hours}h` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Reported to Resolved</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, description, technician..."
              className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | '')}
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by urgency"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as Urgency | '')}
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Urgencies</option>
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {u} Urgency
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by building"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Buildings</option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="tabular-nums">
              Showing {complaints.length} matching {complaints.length === 1 ? 'ticket' : 'tickets'}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-700 min-h-[36px] px-2"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Loading / Empty / Data Views */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-14 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <h2 className="text-base font-semibold text-slate-900">
            No complaints match these filters
          </h2>
          <p className="text-sm text-slate-500">
            Try clearing your search or status filters to see all campus tickets.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 pl-4 pr-3 whitespace-nowrap">Ticket</th>
                    <th className="py-3 px-3">Issue</th>
                    <th className="py-3 px-3 whitespace-nowrap">Category</th>
                    <th className="py-3 px-3 whitespace-nowrap">Urgency</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Upvotes</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Priority</th>
                    <th className="py-3 px-3 whitespace-nowrap">Building</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 whitespace-nowrap">Technician</th>
                    <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {complaints.map((item) => {
                    const isHigh = item.urgency === 'High';
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/admin/complaints/${item.id}`)}
                        className={`cursor-pointer hover:bg-indigo-50/40 transition-colors ${
                          isHigh ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'
                        }`}
                      >
                        <td className="py-3 pl-3.5 pr-3 font-mono text-xs font-semibold text-indigo-700 whitespace-nowrap">
                          {formatTicketCode(item.id)}
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-3">
                            <PhotoBox
                              src={item.photo_url}
                              alt={item.description}
                              category={item.category}
                              className="w-11 h-11 rounded-lg"
                              iconClassName="w-5 h-5"
                            />
                            <div className="min-w-0">
                              <p className="text-slate-900 font-medium line-clamp-2 text-xs leading-snug">
                                {item.description}
                              </p>
                              {item.duplicate_of !== null && (
                                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
                                  Possible duplicate
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${getCategoryIconColor(item.category)}`}>
                            <CategoryIcon category={item.category} className="w-3.5 h-3.5" />
                            <span className="text-slate-700">{item.category}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <UrgencyBadge urgency={item.urgency} score={item.urgency_score} />
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {item.upvote_count}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {item.priority_score}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                          {item.building}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                          {item.technician_name || (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 pr-4 text-right text-xs text-slate-500 whitespace-nowrap">
                          {timeAgo(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="lg:hidden space-y-3">
            {complaints.map((item) => {
              const isHigh = item.urgency === 'High';
              return (
                <Link
                  key={item.id}
                  to={`/admin/complaints/${item.id}`}
                  className={`block bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-indigo-300 transition-colors ${
                    isHigh ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <PhotoBox
                      src={item.photo_url}
                      alt={item.description}
                      category={item.category}
                      className="w-18 h-18 rounded-xl"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {formatTicketCode(item.id)}
                        </span>
                        <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md tabular-nums">
                          Priority {item.priority_score}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <UrgencyBadge urgency={item.urgency} score={item.urgency_score} />
                        <StatusBadge status={item.status} />
                        {item.duplicate_of !== null && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-semibold">
                            Possible duplicate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      {item.category} · {formatLocation(item.building, item.spot)}
                    </span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {item.upvote_count}
                      </span>
                      <span>{item.technician_name || 'Unassigned'}</span>
                      <span className="text-slate-400">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
