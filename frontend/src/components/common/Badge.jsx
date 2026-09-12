import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    // Inventory Statuses
    in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    low_stock: 'bg-amber-50 text-amber-700 border-amber-200/80',
    out_of_stock: 'bg-rose-50 text-rose-700 border-rose-200/80',
    
    // Entity Statuses
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200/80',
    
    // Roles
    admin: 'bg-accent-50 text-accent-700 border-accent-200/80',
    manager: 'bg-brand-50 text-brand-700 border-brand-200/80',
    staff: 'bg-slate-100 text-slate-700 border-slate-200/80',
    
    // Movement Types
    in: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    out: 'bg-amber-50 text-amber-700 border-amber-200/80',
    transfer_in: 'bg-brand-50 text-brand-700 border-brand-200/80',
    transfer_out: 'bg-accent-50 text-accent-700 border-accent-200/80',
    adjustment: 'bg-sky-50 text-sky-700 border-sky-200/80',

    // Generic
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const normalized = (variant || 'default').toLowerCase().replace(/\s+/g, '_');
  const variantClass = variants[normalized] || variants.default;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight ${variantClass} ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {children}
    </span>
  );
}
