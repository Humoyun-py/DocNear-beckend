import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, Clock, ArrowRight, ShieldX, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VerificationBanner: React.FC = () => {
  const { profile } = useAuthStore();

  if (!profile || profile.verificationStatus === 'verified') return null;

  const isPending = profile.verificationStatus === 'pending_verification';
  const isSuspended = profile.verificationStatus === 'suspended';
  const isInactive = profile.verificationStatus === 'inactive';

  return (
    <div
      id="verification-status-banner"
      className={`border-b px-4 py-3 sm:px-6 transition-colors ${
        isPending
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 shrink-0 mt-0.5 sm:mt-0">
            {isPending ? (
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>
                {isPending && 'Your professional profile is currently under review.'}
                {isSuspended && 'Account Suspended: Clinical verification review pending.'}
                {isInactive && 'Account Inactive: Profile re-activation required.'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-semibold bg-white/80 dark:bg-slate-900/80 border border-current">
                {profile.verificationStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
              {isPending
                ? 'Ministry of Health credential verification is 75% complete. Patient booking will be activated once verified.'
                : 'Please contact clinic administration or update board documentation to restore booking features.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 transition-colors"
          >
            <span>Review Submission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
