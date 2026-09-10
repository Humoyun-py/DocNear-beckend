import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  id?: string;
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  label,
  value,
  sublabel,
  icon,
  trend,
  highlight = false,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`group relative p-5 rounded-xl border transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-blue-50/90 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-200 dark:border-blue-900/50 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest">
          {label}
        </p>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white font-mono">
          {typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value}
        </div>
        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {sublabel && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {sublabel}
        </p>
      )}
    </div>
  );
};
