import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Camera,
  ClipboardList,
  Flame,
  LayoutDashboard,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
        <Camera className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        SnapNResolve
      </span>
    </span>
  );
}

const STUDENT_TABS = [
  { to: '/report', label: 'Report', icon: Camera },
  { to: '/feed', label: 'Feed', icon: Flame },
  { to: '/my', label: 'My Complaints', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

const ADMIN_TABS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/admin/technicians', label: 'Technicians', icon: Wrench, end: false },
  { to: '/profile', label: 'Profile', icon: UserIcon, end: false },
];

export function StudentLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Desktop / tablet top bar (scrolls normally on mobile to keep sticky chrome under 15%) */}
      <header className="bg-white border-b border-slate-200 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
          <Link to="/feed" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {STUDENT_TABS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 transition-colors ${
                    active
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            to="/report"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            Report Issue
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-nav-safe md:pb-10">
        {children ?? <Outlet />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-16">
          {STUDENT_TABS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-500 active:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.4 : 1.9}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-medium leading-none truncate max-w-full">
                      {item.label === 'My Complaints' ? 'My Tickets' : item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-5 flex items-center border-b border-slate-100">
          <Link to="/admin" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg">
            <BrandMark />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Admin navigation">
          {ADMIN_TABS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center shrink-0">
              {user?.full_name.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500 truncate">Campus Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 pt-safe">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/admin">
            <BrandMark />
          </Link>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
            Admin
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-nav-safe lg:pb-10">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Admin mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-16">
          {ADMIN_TABS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-500 active:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.4 : 1.9}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-medium leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function RoleAwareLayout({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }
  return <StudentLayout>{children}</StudentLayout>;
}
