import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function AlertBanner({ type = 'error', message, className = '' }) {
  if (!message) return null;

  const types = {
    error: {
      icon: AlertCircle,
      wrapper: 'bg-rose-50 border-rose-200 text-rose-800',
      iconColor: 'text-rose-600',
    },
    warning: {
      icon: AlertTriangle,
      wrapper: 'bg-amber-50 border-amber-200 text-amber-800',
      iconColor: 'text-amber-600',
    },
    success: {
      icon: CheckCircle2,
      wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconColor: 'text-emerald-600',
    },
    info: {
      icon: Info,
      wrapper: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
    },
  };

  const current = types[type] || types.error;
  const Icon = current.icon;

  return (
    <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${current.wrapper} ${className}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 font-medium">{message}</div>
    </div>
  );
}
