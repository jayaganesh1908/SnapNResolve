import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  MapPin,
  RotateCcw,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { UrgencyBadge } from '../components/Badges';
import { CategoryIcon } from '../components/CategoryIcon';
import { PhotoBox } from '../components/PhotoBox';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { AnalysisResult, Complaint } from '../types';
import { BUILDINGS, formatTicketCode, timeAgo } from '../utils/format';
import { compressImage } from '../utils/image';

export default function ReportPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);

  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState(BUILDINGS[0]);
  const [spot, setSpot] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upvotingDuplicate, setUpvotingDuplicate] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setCompressingPhoto(true);
    try {
      const compressed = await compressImage(rawFile, 1280, 0.8);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      showToast('Photo ready for upload', 'info');
    } catch {
      showToast('Could not process that photo. Please try another.', 'error');
    } finally {
      setCompressingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function handleGetGps() {
    if (!('geolocation' in navigator)) {
      setGpsMessage('GPS is not supported on this browser.');
      showToast('GPS is not supported on this device.', 'error');
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsLoading(false);
        showToast('GPS location attached', 'success');
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsMessage(
            'Location permission was denied. You can still submit using the Building and Spot fields above.'
          );
          showToast('Location permission denied', 'error');
        } else {
          setGpsMessage('Could not determine your GPS coordinates right now.');
          showToast('Unable to read GPS location', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      showToast('Please write at least 10 characters describing the issue.', 'error');
      return;
    }
    if (trimmed.length > 1000) {
      showToast('Description must be 1000 characters or fewer.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.analyzeComplaint({
        description: trimmed,
        building,
        spot: spot.trim() || null,
        latitude,
        longitude,
      });
      setAnalysis(res);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Could not analyze complaint.',
        'error'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFinalSubmit(force: boolean) {
    setSubmitting(true);
    try {
      const complaint = await api.createComplaint({
        description: description.trim(),
        building,
        spot: spot.trim() || null,
        latitude,
        longitude,
        photo: photoFile,
        force,
      });
      setCreatedComplaint(complaint);
      showToast(`Ticket ${formatTicketCode(complaint.id)} submitted!`, 'success');
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Failed to submit complaint.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvoteDuplicate(dup: Complaint) {
    setUpvotingDuplicate(true);
    try {
      if (!dup.is_mine && !dup.has_upvoted) {
        await api.toggleUpvote(dup.id);
        showToast(`Upvoted ${formatTicketCode(dup.id)}`, 'success');
      } else if (dup.has_upvoted) {
        showToast(`You already upvoted ${formatTicketCode(dup.id)}`, 'info');
      } else {
        showToast(`Opening your existing ticket ${formatTicketCode(dup.id)}`, 'info');
      }
      navigate(`/complaints/${dup.id}`);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Could not upvote existing ticket.',
        'error'
      );
      navigate(`/complaints/${dup.id}`);
    } finally {
      setUpvotingDuplicate(false);
    }
  }

  function resetForm() {
    clearPhoto();
    setDescription('');
    setBuilding(BUILDINGS[0]);
    setSpot('');
    setLatitude(null);
    setLongitude(null);
    setGpsMessage(null);
    setAnalysis(null);
    setCreatedComplaint(null);
  }

  // Success screen
  if (createdComplaint) {
    return (
      <div className="max-w-lg mx-auto py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-emerald-700">Complaint Submitted</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {formatTicketCode(createdComplaint.id)}
            </h1>
            <p className="text-sm text-slate-600">
              Routed to <strong className="text-slate-900">{createdComplaint.category}</strong> with{' '}
              <strong className="text-slate-900">{createdComplaint.urgency}</strong> urgency.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-left space-y-1.5 text-sm">
            <p className="font-medium text-slate-900">{createdComplaint.building}{createdComplaint.spot ? ` · ${createdComplaint.spot}` : ''}</p>
            <p className="text-slate-600 line-clamp-3">{createdComplaint.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/complaints/${createdComplaint.id}`)}
              className="flex-1 min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Track my complaint
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[48px] px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Report another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const charCount = description.length;
  const charCountColor =
    charCount > 1000
      ? 'text-red-600 font-semibold'
      : charCount >= 10
        ? 'text-emerald-700'
        : 'text-slate-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Report an issue
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Snap a photo, tell us where it is, and AI will route it to the right team.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Photo Capture Area */}
        <div>
          <span className="block text-sm font-semibold text-slate-800 mb-2">
            Photo of the issue
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
            id="issue-photo-input"
          />

          {photoPreview ? (
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={photoPreview}
                  alt="Captured issue preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove photo"
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="issue-photo-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[168px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-400 active:bg-indigo-50 transition-colors p-6 text-center"
            >
              <div className="w-13 h-13 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {compressingPhoto ? 'Optimizing photo...' : 'Tap to take or upload a photo'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically resized for fast mobile upload
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-slate-800">
              What&apos;s broken or needs attention?
            </label>
            <span className={`text-xs tabular-nums ${charCountColor}`}>
              {charCount} / 1000
            </span>
          </div>
          <textarea
            id="description"
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (analysis) setAnalysis(null);
            }}
            placeholder="e.g. Sparks coming from the switchboard near Lab 2 door..."
            className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 resize-y"
          />
          {charCount > 0 && charCount < 10 && (
            <p className="text-xs text-amber-700 mt-1">
              Add {10 - charCount} more {10 - charCount === 1 ? 'character' : 'characters'} (minimum 10).
            </p>
          )}
        </div>

        {/* Building & Spot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="building" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Building
            </label>
            <select
              id="building"
              value={building}
              onChange={(e) => {
                setBuilding(e.target.value);
                if (analysis) setAnalysis(null);
              }}
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            >
              {BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="spot" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Spot <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="spot"
              type="text"
              value={spot}
              onChange={(e) => {
                setSpot(e.target.value);
                if (analysis) setAnalysis(null);
              }}
              placeholder="Room no. or landmark, e.g. Lab 2"
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* GPS Location */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGetGps}
              disabled={gpsLoading}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <MapPin className="w-4 h-4 text-indigo-600" />
              {gpsLoading ? 'Getting GPS...' : 'Use my GPS location'}
            </button>

            {latitude !== null && longitude !== null && (
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-3 py-2 rounded-lg font-mono tabular-nums">
                <span>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLatitude(null);
                    setLongitude(null);
                  }}
                  className="text-slate-500 hover:text-slate-900 font-sans font-semibold ml-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {gpsMessage && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {gpsMessage}
            </p>
          )}
        </div>

        {/* Check & Submit CTA */}
        <button
          type="submit"
          disabled={analyzing || compressingPhoto}
          className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Cpu className="w-4 h-4" />
          {analyzing ? 'Analyzing issue...' : 'Check & Submit'}
        </button>
      </form>

      {/* AI Analysis Result Card */}
      {analysis && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600">
                AI Priority Check
              </p>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <CategoryIcon category={analysis.category} className="w-5 h-5 text-indigo-600" />
                <span>{analysis.category}</span>
                <span className="text-sm font-medium text-slate-500 tabular-nums">
                  ({Math.round(analysis.category_confidence * 100)}% confidence)
                </span>
              </h2>
            </div>
            <UrgencyBadge urgency={analysis.urgency} score={analysis.urgency_score} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">Why this priority?</p>
            <ul className="space-y-1.5">
              {analysis.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-600 mt-1 text-xs" aria-hidden="true">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Duplicate Found Section */}
          {analysis.duplicate ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Possible duplicate already reported
                  </h3>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Upvoting an existing ticket boosts its priority score faster than opening a duplicate.
                    {analysis.similarity !== null && (
                      <span className="ml-1 font-medium tabular-nums">
                        ({Math.round(analysis.similarity * 100)}% match)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Existing Complaint Preview Card */}
              <div className="bg-white rounded-xl border border-amber-200/80 p-3.5 flex gap-3.5 items-start">
                <PhotoBox
                  src={analysis.duplicate.photo_url}
                  alt={analysis.duplicate.description}
                  category={analysis.duplicate.category}
                  className="w-20 h-20 rounded-lg"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">
                      {formatTicketCode(analysis.duplicate.id)}
                    </span>
                    <span>{timeAgo(analysis.duplicate.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">
                    {analysis.duplicate.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                    <span>{analysis.duplicate.building}{analysis.duplicate.spot ? ` · ${analysis.duplicate.spot}` : ''}</span>
                    <span className="font-semibold text-indigo-700 tabular-nums">
                      {analysis.duplicate.upvote_count} upvotes
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={upvotingDuplicate || submitting}
                  onClick={() => handleUpvoteDuplicate(analysis.duplicate!)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {upvotingDuplicate ? 'Upvoting...' : 'Upvote this instead'}
                </button>
                <button
                  type="button"
                  disabled={upvotingDuplicate || submitting}
                  onClick={() => handleFinalSubmit(true)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-100 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Mine is different - submit anyway'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting ticket...' : 'Confirm & Submit Ticket'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setAnalysis(null)}
                className="min-h-[48px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
              >
                Edit details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
