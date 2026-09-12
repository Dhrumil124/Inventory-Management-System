import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    // Inventory Statuses
    in_stock: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    low_stock: 'bg-amber-50 text-amber-800 border-amber-200',
    out_of_stock: 'bg-rose-50 text-rose-800 border-rose-200',
    
    // Entity Statuses
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    
    // Roles
    admin: 'bg-purple-50 text-purple-800 border-purple-200',
    manager: 'bg-blue-50 text-blue-800 border-blue-200',
    staff: 'bg-teal-50 text-teal-800 border-teal-200',
    
    // Movement Types
    in: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    out: 'bg-orange-50 text-orange-800 border-orange-200',
    transfer_in: 'bg-sky-50 text-sky-800 border-sky-200',
    transfer_out: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    adjustment: 'bg-amber-50 text-amber-800 border-amber-200',

    // Generic
    default: 'bg-zinc-100 text-zinc-700 border-zinc-200',
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
