import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 focus:ring-brand-800/25 shadow-xs border border-brand-900/30 font-medium',
    secondary: 'bg-[#F4F2EC] text-stone-700 hover:bg-[#EBE7DE] active:bg-[#E2DDD3] focus:ring-stone-400/20 border border-[#E5E0D6]',
    outline: 'bg-white text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-900 border border-[#E5E0D6] shadow-subtle focus:ring-brand-800/15',
    danger: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus:ring-accent-500/25 shadow-xs border border-accent-700/20',
    ghost: 'bg-transparent text-stone-600 hover:bg-[#F5F2EB] hover:text-stone-900 focus:ring-stone-300',
    accent: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 focus:ring-brand-800/25 shadow-xs border border-brand-900/30',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 text-current shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
