import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import api from '../../api/client';
import {
  User,
  Lock,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, login } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [title, setTitle] = useState(user?.title || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Database Seed state
  const [seedSuccess, setSeedSuccess] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await authApi.updateProfile({ name, phone, title, avatarUrl });
      if (res.success) {
        login(res.data);
        setProfileSuccess('Profile details saved successfully.');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess('Password successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset all databases with demo operations dataset?')) return;
    setSeedLoading(true);
    try {
      const res = await api.post('/seed');
      if (res.success) {
        setSeedSuccess('Demo dataset refreshed! Please reload to see updated state.');
      }
    } catch (err) {
      alert('Seed failed: ' + err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="h-6 w-6 text-indigo-600" />
          Profile & Security Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal credentials, contact info, and system preferences
        </p>
      </div>

      {/* Profile Details Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <Avatar user={{ ...user, avatarUrl, name }} size="lg" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{name || 'Your Name'}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={profileLoading}>
              Save Profile Details
            </Button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-600" />
            Change Security Password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ensure your account is protected with a strong, secure password
          </p>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button type="submit" size="sm" isLoading={passwordLoading}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Developer Demonstration Data Reset */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-400">DEMO & EVALUATION UTILITY</span>
          <h3 className="text-base font-bold mt-1">Refresh Sample Operations Data</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Re-populates Vignan Mahotsav 2027 workspaces, rooms, sample tasks in all 5 statuses,
            schedules, checkpoints, and daily standups.
          </p>
          {seedSuccess && <p className="text-xs text-emerald-400 mt-2 font-bold">{seedSuccess}</p>}
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          isLoading={seedLoading}
          onClick={handleResetSeed}
          className="shrink-0"
        >
          Reset Demo Dataset
        </Button>
      </div>
    </div>
  );
}

