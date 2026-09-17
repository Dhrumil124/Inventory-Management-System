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
    default: 'bg-[#F4F4F4] text-stone-700 border border-[#EBEBEB]',
    gray: 'bg-[#F4F4F4] text-stone-700 border border-[#EBEBEB]',
    brand: 'bg-[#EAF4EE] text-[#27784E] border border-[#D5EADB]',
    forest: 'bg-[#EAF4EE] text-[#27784E] border border-[#D5EADB]',
    mint: 'bg-[#EAF4EE] text-[#27784E] border border-[#D5EADB]',
    emerald: 'bg-[#EAF4EE] text-[#27784E] border border-[#D5EADB]',
    accent: 'bg-[#EAF4EE] text-[#27784E] border border-[#D5EADB]',
    amber: 'bg-[#FDEEE9] text-[#C44D3A] border border-[#FCD8CD]',
    peach: 'bg-[#FDEEE9] text-[#C44D3A] border border-[#FCD8CD]',
    coral: 'bg-[#FDEEE9] text-[#C44D3A] border border-[#FCD8CD]',
    rose: 'bg-[#FDEEE9] text-[#C44D3A] border border-[#FCD8CD]',
    sage: 'bg-[#EAF5F0] text-[#287550] border border-[#D0E7DC]',
    blue: 'bg-[#EDF4F9] text-[#2B638A] border border-[#D3E3EF]',
  };

  return (
    <div className={`bg-white rounded-2xl border border-[#EBE7DE] p-2.5 sm:p-3 xl:p-3.5 shadow-card transition-all hover:border-[#DDD7CC] flex items-center gap-2 xl:gap-2.5 min-w-0 ${className}`}>
      {Icon && (
        <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 xl:w-9.5 xl:h-9.5 rounded-xl shrink-0 flex items-center justify-center font-medium ${iconVariants[variant] || iconVariants.default}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
        </div>
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[11px] sm:text-xs font-medium text-stone-500 leading-tight truncate" title={title}>
          {title}
        </p>
        <p className="text-base sm:text-lg xl:text-xl font-bold text-stone-900 mt-0.5 tracking-tight whitespace-nowrap font-sans leading-none">
          {value}
        </p>
        {trend ? (
          <div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-[10px] sm:text-[11px] leading-tight">
            <span className={`font-semibold shrink-0 ${trend.positive === false ? 'text-[#C44D3A]' : 'text-[#27784E]'}`}>
              {trend.value}
            </span>
            <span className="text-stone-400 text-[9.5px] sm:text-[10.5px] leading-tight truncate">{trend.label}</span>
          </div>
        ) : subtitle ? (
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate" title={subtitle}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
