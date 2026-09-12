import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Sign in to your account</h3>
        <p className="text-xs text-slate-500 mt-1">Enter your corporate credentials to access the inventory system.</p>
      </div>

      {sessionMessage && (
        <AlertBanner type="warning" message={sessionMessage} className="mb-4" />
      )}

      {errorMessage && (
        <AlertBanner type="error" message={errorMessage} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Corporate Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          autoComplete="email"
          icon={Mail}
        />

        <div className="relative">
          <Input
            label="Account Password"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            icon={Lock}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5"
            isLoading={isLoading}
          >
            Sign In to Inventory
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Protected by role-based authorization and activity auditing. Unauthorized access is strictly logged.
        </p>
      </div>
    </div>
  );
}
