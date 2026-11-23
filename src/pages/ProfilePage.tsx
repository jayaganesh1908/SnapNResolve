import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, LogOut, Save, Server, Shield, User as UserIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { APP_VERSION } from '../utils/format';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => api.getApiBaseUrl());
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  function handleSaveServerUrl(e: React.FormEvent) {
    e.preventDefault();
    api.setApiBaseUrl(serverUrl);
    showToast(
      serverUrl.trim()
        ? 'Server address saved for backend connection.'
        : 'Server address cleared (using default).',
      'success'
    );
  }

  async function handleConfirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
      showToast('Signed out successfully', 'info');
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  }

  const initials = user.full_name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Account details and application settings.
        </p>
      </div>

      {/* Account Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {user.full_name}
            </h2>
            <p className="text-sm text-slate-600 truncate">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Account Role</p>
            <p className="font-semibold text-slate-900 mt-0.5 inline-flex items-center gap-1.5">
              {user.role === 'admin' ? (
                <>
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Campus Admin
                </>
              ) : (
                <>
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  Student / Citizen
                </>
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">App Version</p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              v{APP_VERSION}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmLogoutOpen(true)}
          className="w-full min-h-[46px] px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Advanced Section (Collapsed by Default) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          aria-expanded={advancedOpen}
          className="w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-800">
            <Server className="w-4 h-4 text-slate-500" />
            Advanced
          </span>
          {advancedOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {advancedOpen && (
          <form
            onSubmit={handleSaveServerUrl}
            className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3"
          >
            <div>
              <label
                htmlFor="server-address"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Server address
              </label>
              <input
                id="server-address"
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.10:8080"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Point the mobile app to your Spring Boot server IP on the local network during demo or viva.
              </p>
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 inline-flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </form>
        )}
      </div>

      {/* Logout Confirmation Modal (No window.confirm) */}
      <Modal
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Sign out of SnapNResolve?"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            You will need to log in again to report or manage campus complaints.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleConfirmLogout}
              className="flex-1 min-h-[44px] rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {loggingOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
