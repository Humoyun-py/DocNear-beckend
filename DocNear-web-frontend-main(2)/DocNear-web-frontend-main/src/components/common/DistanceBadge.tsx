import React from 'react';
import { MapPin } from 'lucide-react';
import { formatDistance } from '../../utils/geo';

interface DistanceBadgeProps {
  distanceKm?: number;
  highlightNear?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({
  distanceKm,
  highlightNear = true,
  size = 'md',
  className = '',
}) => {
  const isClose = distanceKm !== undefined && distanceKm <= 5.0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const styleClasses =
    highlightNear && isClose
      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${styleClasses} ${className}`}
    >
      <MapPin size={size === 'sm' ? 12 : 13} className="shrink-0 text-blue-600" />
      <span>{formatDistance(distanceKm)}</span>
    </span>
  );
};
