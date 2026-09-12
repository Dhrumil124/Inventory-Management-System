import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { KeyRound, Shield, User, Building2, Check, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password updated successfully. All other active sessions have been invalidated.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Account & Security Settings</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Review your employee credentials, facility scope, and manage authentication credentials.
        </p>
      </div>

      {/* User Profile Summary */}
      <Card title="Corporate Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="min-w-0">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[11px]">Full Name</span>
            <span className="font-semibold text-zinc-900 text-sm mt-1 block truncate">
              {user?.firstName} {user?.lastName}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[11px]">Email Address</span>
            <span className="font-medium text-zinc-800 text-sm mt-1 block truncate" title={user?.email}>
              {user?.email}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[11px]">Role Authorization</span>
            <div className="mt-1.5 flex items-center">
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[11px]">Authorized Scope</span>
            <div className="mt-1.5 text-zinc-700 font-medium flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">
                {user?.role === 'ADMIN'
                  ? 'All Facilities (Global)'
                  : `${user?.warehouses?.length || 0} Facility Assigned`}
              </span>
            </div>
          </div>
        </div>

        {user?.role !== 'ADMIN' && user?.warehouses?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <span className="text-xs font-semibold text-zinc-500 block mb-2">Assigned Facilities:</span>
            <div className="flex flex-wrap gap-2">
              {user.warehouses.map((w) => (
                <span
                  key={w.id}
                  className="px-2.5 py-1 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-700 font-medium"
                >
                  {w.name} ({w.code})
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Password Change Form */}
      <Card
        title="Change Authentication Password"
        subtitle="Updating your password increments your session token version, immediately revoking any other open sessions."
      >
        {success && <AlertBanner type="success" message={success} className="mb-4" />}
        {error && <AlertBanner type="error" message={error} className="mb-4" />}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="••••••••••••"
            required
            icon={Lock}
          />

          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Min 8 chars, mixed case & numbers"
            helperText="Requires at least 8 characters, with uppercase, lowercase, and numbers"
            required
            icon={KeyRound}
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
            icon={KeyRound}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" isLoading={isLoading} icon={KeyRound}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Roles & Permissions Reference */}
      <Card title="System Authorization Matrix Reference" subtitle="Standard operating rules for system roles">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 font-semibold pb-2">
                <th className="py-2 pr-4">Operational Capability</th>
                <th className="py-2 px-3 text-center">ADMIN</th>
                <th className="py-2 px-3 text-center">MANAGER</th>
                <th className="py-2 pl-3 text-center">STAFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="py-2.5 pr-4 font-medium">Facility Access Scope</td>
                <td className="py-2.5 px-3 text-center text-purple-700 font-semibold">Global (All Depots)</td>
                <td className="py-2.5 px-3 text-center text-blue-700 font-semibold">Assigned Depots</td>
                <td className="py-2.5 pl-3 text-center text-zinc-600">Assigned Depots</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Stock In & Stock Out</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 pl-3 text-center text-emerald-700 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Stock Transfers</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Any Facility</td>
                <td className="py-2.5 px-3 text-center text-blue-700 font-semibold">From Assigned</td>
                <td className="py-2.5 pl-3 text-center text-zinc-600">Both Assigned Only</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Stock Adjustments (Audit Reconciliation)</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 pl-3 text-center text-rose-600 font-bold">No (Blocked)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Catalog & Category Management</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 px-3 text-center text-zinc-400">View Only</td>
                <td className="py-2.5 pl-3 text-center text-zinc-400">View Only</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">User & Warehouse Assignment Admin</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">No</td>
                <td className="py-2.5 pl-3 text-center text-rose-600 font-bold">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
