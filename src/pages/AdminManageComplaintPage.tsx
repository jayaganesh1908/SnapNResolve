import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  MapPin,
  Save,
  ThumbsUp,
  User as UserIcon,
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';
import { PhotoBox } from '../components/PhotoBox';
import { StatusTracker } from '../components/StatusTracker';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Category, ComplaintDetail, Status, Technician } from '../types';
import {
  CATEGORIES,
  STATUSES,
  formatDateTime,
  formatLocation,
  formatTicketCode,
  timeAgo,
} from '../utils/format';
import { compressImage } from '../utils/image';

export default function AdminManageComplaintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Editable form state
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Status>('Reported');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Maintenance');
  const [adminNote, setAdminNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      const [detail, techs] = await Promise.all([
        api.getComplaint(numericId),
        api.listTechnicians(),
      ]);
      setComplaint(detail);
      setTechnicians(techs);
      setSelectedTechId(detail.technician_id ? String(detail.technician_id) : '');
      setSelectedStatus(detail.status);
      setSelectedCategory(detail.category);
      setAdminNote(detail.admin_note || '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        showToast(
          err instanceof ApiError ? err.message : 'Unable to load complaint.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active technicians sorted with matching department first
  const { matchingTechs, otherTechs } = useMemo(() => {
    const active = technicians.filter((t) => t.is_active);
    const matching = active.filter((t) => t.department === selectedCategory);
    const others = active.filter((t) => t.department !== selectedCategory);
    return { matchingTechs: matching, otherTechs: others };
  }, [technicians, selectedCategory]);

  const hasTechnician = Boolean(selectedTechId);
  const hasProofPhoto = Boolean(complaint?.proof_photo_url);

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !complaint) return;

    setUploadingProof(true);
    try {
      const compressed = await compressImage(rawFile, 1280, 0.8);
      await api.uploadProofPhoto(complaint.id, compressed);
      const refreshed = await api.getComplaint(complaint.id);
      setComplaint(refreshed);
      showToast('Proof of resolution photo uploaded', 'success');
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Failed to upload proof photo.',
        'error'
      );
    } finally {
      setUploadingProof(false);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  }

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint) return;

    const techIdNumber = selectedTechId ? Number(selectedTechId) : null;

    if ((selectedStatus === 'Assigned' || selectedStatus === 'In Progress') && !techIdNumber) {
      showToast(`Assign a technician before setting status to "${selectedStatus}".`, 'error');
      return;
    }
    if (selectedStatus === 'Resolved' && !complaint.proof_photo_url) {
      showToast('Upload a proof of resolution photo before closing as Resolved.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.updateComplaint(complaint.id, {
        status: selectedStatus,
        technician_id: techIdNumber,
        category: selectedCategory,
        admin_note: adminNote.trim() || null,
      });
      const [refreshed, techs] = await Promise.all([
        api.getComplaint(complaint.id),
        api.listTechnicians(),
      ]);
      setComplaint(refreshed);
      setTechnicians(techs);
      showToast(`Updated ${formatTicketCode(complaint.id)}`, 'success');
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Could not update complaint.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 h-96 bg-white border border-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !complaint) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Ticket not found</h1>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const mapsUrl =
    complaint.latitude !== null && complaint.longitude !== null
      ? `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`
      : null;

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="min-h-[44px] px-3 -ml-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200/60 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="font-mono text-base font-bold text-slate-900">
            {formatTicketCode(complaint.id)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={complaint.urgency} score={complaint.urgency_score} />
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      {/* Possible Duplicate Warning */}
      {complaint.duplicate_of !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Possible duplicate of{' '}
              <Link
                to={`/admin/complaints/${complaint.duplicate_of}`}
                className="font-mono font-bold underline underline-offset-2 text-amber-950 hover:text-indigo-700"
              >
                {formatTicketCode(complaint.duplicate_of)}
              </Link>
            </span>
          </div>
          <Link
            to={`/admin/complaints/${complaint.duplicate_of}`}
            className="text-xs font-semibold text-indigo-700 hover:underline"
          >
            Open original ticket
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details, Photo, Tracker, Timeline */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <PhotoBox
              src={complaint.photo_url}
              alt={complaint.description}
              category={complaint.category}
              className="w-full aspect-[16/10]"
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

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${getCategoryIconColor(complaint.category)}`}>
                  <CategoryIcon category={complaint.category} className="w-4 h-4" />
                  <span className="text-slate-900">{complaint.category}</span>
                </span>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {complaint.upvote_count} upvotes
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-slate-900">
                    Priority {complaint.priority_score}
                  </span>
                </div>
              </div>

              <p className="text-base text-slate-900 leading-relaxed">
                {complaint.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{formatLocation(complaint.building, complaint.spot)}</span>
                  </p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Open in Google Maps
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Reported By</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{complaint.reporter_name || 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(complaint.created_at)} ({timeAgo(complaint.created_at)})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Ticket Lifecycle</h2>
            <StatusTracker status={complaint.status} />
          </div>

          {/* AI Analysis Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                AI Classification Insights
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                {complaint.ai_source === 'ml' ? 'ML model' : 'Keyword backup'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-xl border border-slate-100 p-3.5 text-sm">
              <div>
                <p className="text-xs text-slate-500">Confidence</p>
                <p className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                  {Math.round(complaint.category_confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Urgency Score</p>
                <p className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                  {complaint.urgency_score} / 100
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Priority Score</p>
                <p className="font-mono font-bold text-indigo-700 tabular-nums mt-0.5">
                  {complaint.priority_score}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">AI Reasons</p>
              <ul className="space-y-1.5">
                {complaint.ai_reasons.map((r, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 text-xs" aria-hidden="true">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status Timeline */}
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
        </div>

        {/* Right Column: Admin Actions Console */}
        <div className="lg:col-span-5 space-y-5">
          {/* Proof of Resolution Photo Upload Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Proof of Resolution
              </h2>
              {hasProofPhoto && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Uploaded
                </span>
              )}
            </div>

            <input
              ref={proofInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleProofUpload}
              className="sr-only"
              id="proof-photo-input"
            />

            {complaint.proof_photo_url ? (
              <div className="space-y-3">
                <PhotoBox
                  src={complaint.proof_photo_url}
                  alt="Proof of resolution"
                  category={complaint.category}
                  className="w-full aspect-[4/3] rounded-xl"
                  onClick={() =>
                    setLightbox({
                      src: complaint.proof_photo_url!,
                      title: `${formatTicketCode(complaint.id)} — Proof of Resolution`,
                    })
                  }
                />
                <button
                  type="button"
                  disabled={uploadingProof}
                  onClick={() => proofInputRef.current?.click()}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {uploadingProof ? 'Uploading...' : 'Replace proof photo'}
                </button>
              </div>
            ) : (
              <label
                htmlFor="proof-photo-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-400 p-5 text-center transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {uploadingProof ? 'Compressing & uploading...' : 'Upload proof of resolution photo'}
                </p>
                <p className="text-xs text-slate-500">
                  Required before changing status to Resolved
                </p>
              </label>
            )}
          </div>

          {/* Manage Ticket Form */}
          <form
            onSubmit={handleSaveChanges}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900">Manage Ticket</h2>

            {/* Correct Category */}
            <div>
              <label
                htmlFor="admin-category"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Department / Category
              </label>
              <select
                id="admin-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Correct the department if the AI misclassified this ticket.
              </p>
            </div>

            {/* Assign Technician */}
            <div>
              <label
                htmlFor="admin-tech"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Assign Technician
              </label>
              <select
                id="admin-tech"
                value={selectedTechId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTechId(val);
                  // If clearing technician while on Assigned/In Progress, revert status to Reported
                  if (!val && (selectedStatus === 'Assigned' || selectedStatus === 'In Progress')) {
                    setSelectedStatus('Reported');
                  }
                }}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Unassigned</option>
                {matchingTechs.length > 0 && (
                  <optgroup label={`${selectedCategory} Department (Recommended)`}>
                    {matchingTechs.map((tech) => (
                      <option key={tech.id} value={String(tech.id)}>
                        {tech.name} — {tech.department} ({tech.open_tickets} open)
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherTechs.length > 0 && (
                  <optgroup label="Other Active Technicians">
                    {otherTechs.map((tech) => (
                      <option key={tech.id} value={String(tech.id)}>
                        {tech.name} — {tech.department} ({tech.open_tickets} open)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Status Selection */}
            <div>
              <label
                htmlFor="admin-status"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Ticket Status
              </label>
              <select
                id="admin-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as Status)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {STATUSES.map((st) => {
                  const disabled =
                    ((st === 'Assigned' || st === 'In Progress') && !hasTechnician) ||
                    (st === 'Resolved' && !hasProofPhoto);
                  return (
                    <option key={st} value={st} disabled={disabled}>
                      {st}
                      {disabled && (st === 'Assigned' || st === 'In Progress')
                        ? ' (Select technician first)'
                        : disabled && st === 'Resolved'
                          ? ' (Upload proof photo first)'
                          : ''}
                    </option>
                  );
                })}
              </select>

              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {!hasTechnician && (
                  <p>• Choose a technician to enable Assigned / In Progress.</p>
                )}
                {!hasProofPhoto && (
                  <p>• Upload a proof of resolution photo above to enable Resolved.</p>
                )}
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <label
                htmlFor="admin-note"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Status Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="admin-note"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add repair progress note or closure remarks..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving updates...' : 'Save Changes'}
            </button>
          </form>
        </div>
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
