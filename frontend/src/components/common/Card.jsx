import React from 'react';

export default function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div className={`bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100">{footer}</div>}
    </div>
  );
}
