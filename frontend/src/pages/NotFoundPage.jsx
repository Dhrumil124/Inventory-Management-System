import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-zinc-200/90 shadow-card">
        <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Page Not Found (404)</h1>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
          The inventory page or resource you requested does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" icon={Home} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
