import React from 'react';

export default function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#EBE7DE] shadow-card overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[#F0ECE4] flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="px-5 py-3.5 sm:px-6 bg-[#FAF8F5] border-t border-[#F0ECE4]">{footer}</div>}
    </div>
  );
}
