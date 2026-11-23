import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, MapPin, RefreshCw, ThumbsUp } from 'lucide-react';
import { UrgencyBadge } from '../components/Badges';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { PhotoBox } from '../components/PhotoBox';
import { StatusTracker } from '../components/StatusTracker';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Complaint } from '../types';
import { formatLocation, formatTicketCode, timeAgo } from '../utils/format';

export default function MyComplaintsPage() {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyComplaints = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await api.listMyComplaints();
        setComplaints(data);
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : 'Could not load your complaints.',
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
    loadMyComplaints(false);
  }, [loadMyComplaints]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Complaints
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track live repair progress and proof photos for issues you reported.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadMyComplaints(true)}
          disabled={refreshing || loading}
          className="min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
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
              Issues you submit will appear here with step-by-step repair tracking.
            </p>
          </div>
          <Link
            to="/report"
            className="min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-indigo-700"
          >
            <Camera className="w-4 h-4" />
            Report an issue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => (
            <Link
              key={item.id}
              to={`/complaints/${item.id}`}
              className="block bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all p-4 sm:p-5 space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="flex gap-3.5 sm:gap-4 items-start">
                <PhotoBox
                  src={item.photo_url}
                  alt={item.description}
                  category={item.category}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl"
                />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                      <span className="font-mono font-semibold text-slate-900">
                        {formatTicketCode(item.id)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 truncate ${getCategoryIconColor(item.category)}`}>
                        <CategoryIcon category={item.category} className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-slate-700 font-medium truncate">
                          {item.category}
                        </span>
                      </span>
                    </div>
                    <UrgencyBadge urgency={item.urgency} />
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-900 line-clamp-2 leading-snug">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {formatLocation(item.building, item.spot)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{timeAgo(item.created_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <ThumbsUp className="w-3 h-3" />
                      {item.upvote_count} upvotes
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center hidden sm:block" />
              </div>

              {/* 4-Step Status Tracker */}
              <div className="pt-3 border-t border-slate-100">
                <StatusTracker status={item.status} compact />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
