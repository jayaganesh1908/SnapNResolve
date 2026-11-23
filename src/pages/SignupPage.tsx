import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, User as UserIcon } from 'lucide-react';
import { BrandMark } from '../components/Layouts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError } from '../services/api';

export default function SignupPage() {
  const { signUp, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await signUp(fullName, email, password);
      showToast(`Account created! Welcome, ${user.full_name}`, 'success');
      navigate('/feed', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Could not create your account. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(targetEmail: string) {
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(targetEmail, 'demo1234');
      showToast(`Signed in as ${user.full_name}`, 'success');
      navigate(user.role === 'admin' ? '/admin' : '/feed', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Demo sign-in failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col pt-safe pb-safe">
      <div className="max-w-md w-full mx-auto px-4 py-6 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 min-h-[44px] px-2 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <BrandMark />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Join your campus community to report and track facility fixes.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ravi Teja"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="signup_email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="signup_email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="signup_password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="signup_password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                Must be at least 8 characters.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.99] transition-all"
            >
              {submitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 text-center mb-3">
              Or try a demo account immediately
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDemoLogin('ravi@demo.com')}
                className="min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-800 hover:text-indigo-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                Demo as Student
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDemoLogin('admin@demo.com')}
                className="min-h-[46px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-800 hover:text-indigo-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <Shield className="w-4 h-4 shrink-0" />
                Demo as Admin
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
