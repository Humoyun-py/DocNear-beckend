import React from 'react';

export const ClinicCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col md:flex-row gap-5 overflow-hidden relative transition-colors duration-200">
      <div className="w-full md:w-52 h-40 shimmer rounded-xl shrink-0"></div>
      <div className="flex-1 space-y-3.5 py-1">
        <div className="flex justify-between items-start">
          <div className="h-6 shimmer rounded-md w-2/3"></div>
          <div className="h-6 shimmer rounded-full w-20"></div>
        </div>
        <div className="h-4 shimmer rounded-md w-3/4"></div>
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="h-6 shimmer rounded-md w-20"></div>
          <div className="h-6 shimmer rounded-md w-24"></div>
          <div className="h-6 shimmer rounded-md w-16"></div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="h-4 shimmer rounded-md w-32"></div>
          <div className="h-9 shimmer rounded-xl w-32"></div>
        </div>
      </div>
    </div>
  );
};

export const DoctorCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 overflow-hidden relative transition-colors duration-200">
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-full shimmer shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-5 shimmer rounded-md w-1/2"></div>
            <div className="h-5 shimmer rounded-full w-14"></div>
          </div>
          <div className="h-4 shimmer rounded-md w-1/3"></div>
          <div className="h-3.5 shimmer rounded-md w-2/3"></div>
        </div>
      </div>
      <div className="h-14 shimmer rounded-xl"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 shimmer rounded-md w-28"></div>
        <div className="flex gap-2">
          <div className="h-9 shimmer rounded-xl w-24"></div>
          <div className="h-9 shimmer rounded-xl w-28"></div>
        </div>
      </div>
    </div>
  );
};

export const MapSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 shimmer opacity-60"></div>
      <div className="relative z-10 text-center space-y-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Loading interactive map & markers...</p>
      </div>
    </div>
  );
};

export const ClinicListSkeleton: React.FC<{ count?: number; layout?: 'grid' | 'list' }> = ({
  count = 3,
  layout = 'list',
}) => {
  return (
    <div
      className={
        layout === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ClinicCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const DoctorListSkeleton: React.FC<{ count?: number; layout?: 'grid' | 'list' }> = ({
  count = 4,
  layout = 'list',
}) => {
  return (
    <div
      className={
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <DoctorCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const ClinicDetailsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back button skeleton */}
      <div className="h-6 shimmer rounded-md w-28"></div>

      {/* Hero Banner Shimmer */}
      <div className="relative h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shimmer-darker">
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-6 shimmer rounded-full w-32"></div>
            <div className="h-9 shimmer rounded-lg w-72 md:w-96"></div>
            <div className="h-4 shimmer rounded-md w-48"></div>
          </div>
          <div className="hidden sm:block h-10 shimmer rounded-xl w-36"></div>
        </div>
      </div>

      {/* Grid: Main Info + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Quick stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-8 h-8 shimmer rounded-lg"></div>
                <div className="h-4 shimmer rounded-md w-20"></div>
                <div className="h-5 shimmer rounded-md w-14"></div>
              </div>
            ))}
          </div>

          {/* About section shimmer */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-6 shimmer rounded-md w-40"></div>
            <div className="h-4 shimmer rounded-md w-full"></div>
            <div className="h-4 shimmer rounded-md w-5/6"></div>
            <div className="h-4 shimmer rounded-md w-4/6"></div>
          </div>

          {/* Doctors Section Shimmer */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 shimmer rounded-md w-48"></div>
              <div className="h-4 shimmer rounded-md w-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Shimmer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="h-6 shimmer rounded-md w-36"></div>
            <div className="space-y-3">
              <div className="h-10 shimmer rounded-xl w-full"></div>
              <div className="h-10 shimmer rounded-xl w-full"></div>
              <div className="h-10 shimmer rounded-xl w-full"></div>
            </div>
            <div className="h-12 shimmer rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DoctorDetailsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back button skeleton */}
      <div className="h-6 shimmer rounded-md w-28"></div>

      {/* Main doctor header shimmer */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl shimmer shrink-0"></div>
        <div className="flex-1 space-y-3 w-full text-center md:text-left">
          <div className="h-7 shimmer rounded-md w-60 mx-auto md:mx-0"></div>
          <div className="h-5 shimmer rounded-md w-40 mx-auto md:mx-0"></div>
          <div className="h-4 shimmer rounded-md w-80 max-w-full mx-auto md:mx-0"></div>
          <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
            <div className="h-8 shimmer rounded-lg w-28"></div>
            <div className="h-8 shimmer rounded-lg w-28"></div>
            <div className="h-8 shimmer rounded-lg w-28"></div>
          </div>
        </div>
      </div>

      {/* Grid: Schedule selector + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-6 shimmer rounded-md w-44"></div>
            <div className="h-4 shimmer rounded-md w-full"></div>
            <div className="h-4 shimmer rounded-md w-4/5"></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-6 shimmer rounded-md w-40"></div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 shimmer rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-10 shimmer rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-6 shimmer rounded-md w-36"></div>
            <div className="h-10 shimmer rounded-xl w-full"></div>
            <div className="h-12 shimmer rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
