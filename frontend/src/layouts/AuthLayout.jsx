import React from 'react';
import { Outlet } from 'react-router-dom';
import { Boxes } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-forest-100 selection:text-forest-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-900 text-white shadow-sm mb-4">
          <Boxes className="w-7 h-7 text-forest-300" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Inventory Management System
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Centralized Multi-Warehouse Enterprise Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-zinc-200/90">
          <Outlet />
        </div>
        <div className="mt-6 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} Standalone Inventory Management System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
