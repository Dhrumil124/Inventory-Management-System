import React from 'react';

export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-200/70 rounded-md ${className}`} />;
}
