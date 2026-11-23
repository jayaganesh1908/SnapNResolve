import { Link } from 'react-router-dom';
import { ArrowRight, Camera, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../components/Layouts';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
  {
    number: '01',
    icon: Camera,
    title: 'Snap a photo',
    description:
      'Capture a broken fan, leaking cooler, faulty Wi-Fi, or unclean washroom right from your phone with location.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI sorts it',
    description:
      'Automatic department routing, urgency scoring, and duplicate detection prioritize critical campus safety hazards first.',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'Get it fixed',
    description:
      'Admins assign the right technician and close every ticket with a verified proof-of-resolution photo.',
  },
];

export default function WelcomePage() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/feed';

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
              >
                Open App
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-3.5 min-h-[44px] rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 min-h-[44px] rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-sm font-semibold text-indigo-600">
                Campus &amp; Community Issue Tracker
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
                Snap it. Report it. Get it fixed.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Report broken campus facilities in seconds. SnapNResolve automatically routes tickets to the right maintenance department, elevates urgent safety issues, and tracks repairs through verified photo proof.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {user ? (
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm"
                  >
                    Continue to {user.role === 'admin' ? 'Admin Dashboard' : 'Community Feed'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm"
                    >
                      Log in
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center px-6 min-h-[48px] rounded-xl bg-white text-slate-800 font-semibold text-base border border-slate-200 hover:bg-slate-100 active:scale-[0.99] transition-all"
                    >
                      Create Student Account
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  Anonymous on public feed
                </span>
                <span aria-hidden="true">·</span>
                <span>Proof-of-resolution verified</span>
              </div>
            </div>

            {/* Visual Before/After Showcase Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="/src/assets/images/campus_electrical_switchboard_1795393897374.jpg"
                        alt="Reported damaged switchboard outside Computer Lab"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                        Reported
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Block A · Outside Lab 2
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="/src/assets/images/campus_repaired_proof_1795393897726.jpg"
                        alt="Verified repaired electrical switchboard proof photo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-emerald-700/90 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                        Proof Photo
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Resolved · Verified Fix
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Auto-routed to Electrical · Priority Score 164</span>
                  <span className="font-mono text-slate-700 font-semibold">SNR-0001</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white border-t border-slate-200 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How it works
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Three straightforward steps from spotting an issue to verified campus repair.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="font-mono text-sm font-semibold text-slate-400 tabular-nums">
                        {step.number}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-6 pb-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>SnapNResolve — Campus Maintenance &amp; Issue Tracker</span>
          <span>Built for students and campus facility teams</span>
        </div>
      </footer>
    </div>
  );
}
