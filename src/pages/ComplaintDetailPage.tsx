import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';
import { PhotoBox } from '../components/PhotoBox';
import { StatusTracker } from '../components/StatusTracker';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { ComplaintDetail } from '../types';
import {
  formatDateTime,
  formatLocation,
  formatTicketCode,
  timeAgo,
} from '../utils/format';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.getComplaint(numericId);
      setComplaint(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        showToast(
          err instanceof ApiError ? err.message : 'Unable to load complaint details.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleUpvote() {
    if (!complaint || complaint.is_mine || upvoting) return;
    setUpvoting(true);
    try {
      const res = await api.toggleUpvote(complaint.id);
      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              has_upvoted: res.upvoted,
              upvote_count: res.upvote_count,
              priority_score: prev.urgency_score + 5 * res.upvote_count,
            }
          : prev
      );
      showToast(res.upvoted ? 'Upvoted complaint' : 'Upvote removed', 'info');
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Unable to update upvote.',
        'error'
      );
    } finally {
      setUpvoting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-44 bg-white border border-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (notFound || !complaint) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Complaint not found</h1>
        <p className="text-sm text-slate-600">
          This ticket may have been removed or the link is incorrect.
        </p>
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  const mapsUrl =
    complaint.latitude !== null && complaint.longitude !== null
      ? `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back Button */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-[44px] px-3 -ml-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200/60 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="font-mono text-sm font-bold text-slate-800">
          {formatTicketCode(complaint.id)}
        </span>
      </div>

      {/* Possible Duplicate Banner */}
      {complaint.duplicate_of !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Possible duplicate of{' '}
              <Link
                to={`/complaints/${complaint.duplicate_of}`}
                className="font-mono font-bold underline underline-offset-2 text-amber-950 hover:text-indigo-700"
              >
                {formatTicketCode(complaint.duplicate_of)}
              </Link>
            </span>
          </div>
          <Link
            to={`/complaints/${complaint.duplicate_of}`}
            className="text-xs font-semibold text-indigo-700 hover:underline"
          >
            View original ticket
          </Link>
        </div>
      )}

      {/* Main Photo + Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <PhotoBox
          src={complaint.photo_url}
          alt={complaint.description}
          category={complaint.category}
          className="w-full aspect-[16/10] sm:aspect-[16/9]"
          iconClassName="w-14 h-14"
          onClick={
            complaint.photo_url
              ? () =>
                  setLightbox({
                    src: complaint.photo_url!,
                    title: `${formatTicketCode(complaint.id)} — Reported Photo`,
                  })
              : undefined
          }
        />

        <div className="p-5 sm:p-6 space-y-5">
          {/* Header Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${getCategoryIconColor(complaint.category)}`}>
                <CategoryIcon category={complaint.category} className="w-4 h-4" />
                <span className="text-slate-900">{complaint.category}</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-xs text-slate-500">{timeAgo(complaint.created_at)}</span>
            </div>

            <div className="flex items-center gap-2">
              <UrgencyBadge urgency={complaint.urgency} score={complaint.urgency_score} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          {/* Description */}
          <p className="text-base text-slate-900 leading-relaxed">
            {complaint.description}
          </p>

          {/* Location + Maps + Upvote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{formatLocation(complaint.building, complaint.spot)}</span>
              </p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 min-h-[36px]"
                >
                  Open in Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <button
              type="button"
              disabled={complaint.is_mine || upvoting}
              onClick={handleUpvote}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all tabular-nums ${
                complaint.is_mine
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : complaint.has_upvoted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <ThumbsUp
                className={`w-4 h-4 ${complaint.has_upvoted ? 'fill-current' : ''}`}
              />
              <span>
                {complaint.upvote_count}{' '}
                {complaint.upvote_count === 1 ? 'Upvote' : 'Upvotes'}
              </span>
              {complaint.is_mine && <span className="text-xs">(Yours)</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Status Tracker & Technician Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Repair Progress</h2>
          <span className="text-xs text-slate-500 tabular-nums">
            Priority Score: <strong className="text-slate-800">{complaint.priority_score}</strong>
          </span>
        </div>

        <StatusTracker status={complaint.status} />

        {complaint.technician_name && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Assigned Technician</p>
              <p className="text-sm font-semibold text-slate-900">
                {complaint.technician_name}
              </p>
            </div>
          </div>
        )}

        {complaint.admin_note && (
          <div className="bg-indigo-50/60 rounded-xl border border-indigo-100 px-4 py-3">
            <p className="text-xs font-semibold text-indigo-700">Maintenance Note</p>
            <p className="text-sm text-slate-800 mt-0.5">{complaint.admin_note}</p>
          </div>
        )}
      </div>

      {/* Proof of Resolution Photo */}
      {complaint.status === 'Resolved' && complaint.proof_photo_url && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Proof of Resolution
            </h2>
            {complaint.resolved_at && (
              <span className="text-xs text-emerald-700">
                {formatDateTime(complaint.resolved_at)}
              </span>
            )}
          </div>
          <PhotoBox
            src={complaint.proof_photo_url}
            alt={`Proof of resolution for ${formatTicketCode(complaint.id)}`}
            category={complaint.category}
            className="w-full aspect-[16/10] rounded-xl"
            onClick={() =>
              setLightbox({
                src: complaint.proof_photo_url!,
                title: `${formatTicketCode(complaint.id)} — Proof of Resolution`,
              })
            }
          />
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Status Timeline
        </h2>

        <ol className="relative border-l-2 border-slate-200 ml-2.5 space-y-5">
          {complaint.history.map((entry, idx) => {
            const isLatest = idx === complaint.history.length - 1;
            return (
              <li key={entry.id} className="pl-5 relative">
                <span
                  className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                    entry.status === 'Resolved'
                      ? 'bg-emerald-600'
                      : isLatest
                        ? 'bg-indigo-600'
                        : 'bg-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={entry.status} />
                  <time className="text-xs text-slate-500 tabular-nums">
                    {formatDateTime(entry.created_at)}
                  </time>
                </div>
                {entry.note && (
                  <p className="text-sm text-slate-700 mt-1.5 leading-snug">
                    {entry.note}
                  </p>
                )}
                {entry.changed_by_name && (
                  <p className="text-xs text-slate-400 mt-1">
                    Updated by {entry.changed_by_name}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Lightbox Modal */}
      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.title}
        maxWidthClass="max-w-3xl"
      >
        {lightbox && (
          <img
            src={lightbox.src}
            alt={lightbox.title}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[75dvh] object-contain rounded-xl bg-slate-100"
          />
        )}
      </Modal>
    </div>
  );
}
