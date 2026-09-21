import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16 mt-4" />
    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-32 mt-2" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 animate-pulse space-y-4">
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse">
    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-40 mb-6" />
    <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl flex items-end gap-3 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
          style={{ height: `${(i % 5 + 2) * 18}%` }}
        />
      ))}
    </div>
  </div>
);
