import React from 'react';
import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  reviewCount,
  showCount = true,
  size = 'md',
  className = '',
}) => {
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-1 text-amber-600 ${textSizes[size]} ${className}`}>
      <Star size={iconSizes[size]} className="fill-amber-400 text-amber-400 shrink-0" />
      <span>{rating.toFixed(1)}</span>
      {showCount && reviewCount !== undefined && (
        <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">({reviewCount})</span>
      )}
    </div>
  );
};
