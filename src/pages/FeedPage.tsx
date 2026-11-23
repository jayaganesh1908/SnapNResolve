import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, RefreshCw, ThumbsUp } from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { PhotoBox } from '../components/PhotoBox';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Category, Complaint } from '../types';
import { CATEGORIES, formatLocation, formatTicketCode, timeAgo } from '../utils/format';

export default function FeedPage() {
  const { showToast } = useToast();
  const [sort, setSort] = useState<'upvotes' | 'newest'>('upvotes');
  const [category, setCategory] = useState<Category | ''>('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState<Record<number, boolean>>({});

  const fetchFeed = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await api.listComplaints({
          open_only: true,
          category,
          sort,
        });
        setComplaints(data);
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : 'Could not load community feed.',
          'error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, sort, showToast]
  );

  useEffect(() => {
    fetchFeed(false);
  }, [fetchFeed]);

  async function handleUpvote(e: React.MouseEvent, item: Complaint) {
    e.preventDefault();
    e.stopPropagation();
    if (item.is_mine || upvotingIds[item.id]) return;

    setUpvotingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await api.toggleUpvote(item.id);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                has_upvoted: res.upvoted,
                upvote_count: res.upvote_count,
                priority_score: c.urgency_score + 5 * res.upvote_count,
              }
            : c
        )
      );
      showToast(
        res.upvoted ? `Upvoted ${formatTicketCode(item.id)}` : 'Upvote removed',
        'info'
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Unable to update upvote.',
        'error'
      );
    } finally {
      setUpvotingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Community Feed
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Open campus issues. Upvote ones affecting you to raise priority.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchFeed(true)}
          disabled={refreshing || loading}
          className="min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Sort Tabs & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Sort complaints"
          className="inline-flex p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={sort === 'upvotes'}
            onClick={() => setSort('upvotes')}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              sort === 'upvotes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Most upvoted
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sort === 'newest'}
            onClick={() => setSort('newest')}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              sort === 'newest'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Newest
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
              category === ''
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(active ? '' : cat)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 animate-pulse"
            >
              <div className="w-24 h-24 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-7 bg-slate-100 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              No complaints yet - be the first to report one
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {category
                ? `There are currently no open ${category} complaints.`
                : 'All reported campus issues are currently resolved.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            {category && (
              <button
                type="button"
                onClick={() => setCategory('')}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Show all categories
              </button>
            )}
            <Link
              to="/report"
              className="min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-indigo-700"
            >
              <Camera className="w-4 h-4" />
              Report an issue
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((item) => (
            <Link
              key={item.id}
              to={`/complaints/${item.id}`}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all p-4 flex flex-col gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="flex gap-3.5 items-start">
                <PhotoBox
                  src={item.photo_url}
                  alt={item.description}
                  category={item.category}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl"
                />

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Top metadata line */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                      <span className="font-mono font-semibold text-slate-800 shrink-0">
                        {formatTicketCode(item.id)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 truncate ${getCategoryIconColor(item.category)}`}>
                        <CategoryIcon category={item.category} className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-medium text-slate-700">{item.category}</span>
                      </span>
                    </div>
                    <UrgencyBadge urgency={item.urgency} />
                  </div>

                  {/* Description (2 lines) */}
                  <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                    {item.description}
                  </p>

                  {/* Location */}
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{formatLocation(item.building, item.spot)}</span>
                  </p>
                </div>
              </div>

              {/* Footer Row: Status + Time Ago + Upvote Button */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-slate-500 truncate">
                    {timeAgo(item.created_at)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={item.is_mine || Boolean(upvotingIds[item.id])}
                  onClick={(e) => handleUpvote(e, item)}
                  title={
                    item.is_mine
                      ? 'You reported this complaint'
                      : item.has_upvoted
                        ? 'Remove upvote'
                        : 'Upvote this issue'
                  }
                  className={`min-h-[44px] px-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all tabular-nums shrink-0 ${
                    item.is_mine
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : item.has_upvoted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97]'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.97]'
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${item.has_upvoted ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{item.upvote_count}</span>
                  {item.is_mine && (
                    <span className="text-[11px] font-medium ml-0.5">(Yours)</span>
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
