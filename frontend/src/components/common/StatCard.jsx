import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className = '',
}) {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    brand: 'bg-brand-50 text-brand-700 border border-brand-200/60',
    forest: 'bg-brand-50 text-brand-700 border border-brand-200/60',
    accent: 'bg-accent-50 text-accent-700 border border-accent-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200/60',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-subtle min-w-0 overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate" title={title}>
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight truncate" title={typeof value === 'string' ? value : undefined}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${iconVariants[variant] || iconVariants.default}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span className={trend.positive ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
            {trend.value}
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
