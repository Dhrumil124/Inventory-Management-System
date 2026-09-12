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
    default: 'bg-zinc-100 text-zinc-700',
    forest: 'bg-forest-50 text-forest-800 border border-forest-100',
    amber: 'bg-amber-50 text-amber-800 border border-amber-100',
    rose: 'bg-rose-50 text-rose-800 border border-rose-100',
    blue: 'bg-blue-50 text-blue-800 border border-blue-100',
  };

  return (
    <div className={`bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs transition-shadow hover:shadow-subtle ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1.5 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconVariants[variant] || iconVariants.default}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-xs">
          <span className={trend.positive ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
            {trend.value}
          </span>
          <span className="text-zinc-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
