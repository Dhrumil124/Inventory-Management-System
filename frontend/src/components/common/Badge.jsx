import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    // Inventory Statuses
    in_stock: 'bg-pastel-mint text-pastel-mint-text border-[#CDE5D8]',
    low_stock: 'bg-pastel-peach text-pastel-peach-text border-[#FBD6CC]',
    out_of_stock: 'bg-pastel-peach text-pastel-peach-text border-[#FBD6CC]',
    
    // Entity Statuses
    active: 'bg-pastel-mint text-pastel-mint-text border-[#CDE5D8]',
    inactive: 'bg-[#F4F2EC] text-[#78716C] border-[#E5E0D6]',
    
    // Roles
    admin: 'bg-[#1E3A2F] text-white border-[#1E3A2F]',
    manager: 'bg-pastel-mint text-pastel-mint-text border-[#CDE5D8]',
    staff: 'bg-[#F4F2EC] text-[#55504A] border-[#E5E0D6]',
    
    // Movement Types
    in: 'bg-pastel-mint text-pastel-mint-text border-[#CDE5D8]',
    stock_in: 'bg-pastel-mint text-pastel-mint-text border-[#CDE5D8]',
    out: 'bg-pastel-peach text-pastel-peach-text border-[#FBD6CC]',
    stock_out: 'bg-pastel-peach text-pastel-peach-text border-[#FBD6CC]',
    transfer: 'bg-pastel-blue text-pastel-blue-text border-[#D0E2EE]',
    transfer_in: 'bg-pastel-blue text-pastel-blue-text border-[#D0E2EE]',
    transfer_out: 'bg-pastel-peach text-pastel-peach-text border-[#FBD6CC]',
    adjustment: 'bg-[#F4F2EC] text-[#55504A] border-[#E5E0D6]',

    // Generic
    default: 'bg-[#F4F2EC] text-[#55504A] border-[#E5E0D6]',
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
