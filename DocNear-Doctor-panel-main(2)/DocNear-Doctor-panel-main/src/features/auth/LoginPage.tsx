import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import {
  Activity,
  ShieldCheck,
  CalendarCheck,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const success = await login({
      identifier,
      password,
      rememberMe,
    });

    if (success) {
      addToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Your clinical workspace is ready for today.',
      });
      navigate('/dashboard');
    } else {
      setErrorMsg('Invalid clinical credentials. Please check your email or password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* Left: Brand/Product showcase */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Ambient medical graphic accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {/* Brand Logo */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-md">
                  <Activity className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-2xl tracking-tight text-white">DocNear</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                      Doctor
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 font-medium">Healthcare Partner Network</p>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  The clinical portal designed for modern physicians.
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Manage patient consultations, real-time appointments, working hours, and clinic
                  coordination from a single high-efficiency dashboard.
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mt-10 relative z-10 space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-blue-100">
                <div className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span>Streamlined booking approvals & conflict prevention</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-100">
                <div className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <span>Patient appointments & visit analytics</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-100">
                <div className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Certified clinic integration & verified credentials</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-white/10 text-xs text-blue-200/80 flex items-center justify-between">
              <span>DocNear Partner v2.6</span>
              <span className="font-mono">Doctor Portal</span>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Doctor Portal Sign In
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Enter your registered clinical email or verified mobile number.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Phone or Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-identifier-input"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. akmal.karimov@docnear.med"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        addToast({
                          type: 'info',
                          title: 'Password Recovery',
                          message: 'Contact your clinic administrator to reset portal access credentials.',
                        })
                      }
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  id="sign-in-button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 shadow-sm transition-all"
                >
                  <span>{isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Help & Support note */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need help accessing your clinical account?{' '}
                <button
                  type="button"
                  onClick={() =>
                    addToast({
                      type: 'info',
                      title: 'DocNear Partner Support',
                      message: 'Please contact your clinic administrator.',
                    })
                  }
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Contact Clinic Support
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
