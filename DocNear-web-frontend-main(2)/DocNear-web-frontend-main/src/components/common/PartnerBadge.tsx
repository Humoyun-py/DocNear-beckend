import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PartnerBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const PartnerBadge: React.FC<PartnerBadgeProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1 font-bold',
    md: 'px-2 py-0.5 text-[11px] gap-1 font-bold',
    lg: 'px-2.5 py-1 text-xs gap-1.5 font-bold',
  };

  const iconSizes = {
    sm: 11,
    md: 12,
    lg: 14,
  };

  return (
    <span
      id="partner-verified-badge"
      className={`inline-flex items-center rounded uppercase tracking-wider bg-emerald-100 text-emerald-700 font-bold ${sizeClasses[size]} ${className}`}
      title="Verified Official Partner Clinic"
    >
      <ShieldCheck size={iconSizes[size]} className="text-emerald-700 shrink-0" />
      {showText && <span>Partner</span>}
    </span>
  );
};
