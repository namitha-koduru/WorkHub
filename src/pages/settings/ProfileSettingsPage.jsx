import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import {
  User,
  Lock,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Hash,
  Copy,
  Check,
  ShieldCheck,
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

  // Copy state
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!user?.memberId) return;
    navigator.clipboard.writeText(user.memberId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="h-6 w-6 text-indigo-600" />
          Profile & Account Identity
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your credentials, professional title, and unique collaboration identity
        </p>
      </div>

      {/* Member Unique ID Card */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-violet-50 rounded-2xl border border-indigo-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              Unique Member ID
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Active Identity
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {user?.memberId || 'WH-000000'}
            </span>
            <Button
              size="xs"
              variant="outline"
              icon={copiedId ? Check : Copy}
              onClick={handleCopyId}
            >
              {copiedId ? 'Copied' : 'Copy ID'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 pt-1 max-w-lg">
            Share this ID with workspace owners and managers to be added directly to any workspace, department, or room without requiring an email invitation.
          </p>
        </div>

        <div className="bg-white/80 border border-slate-200 p-4 rounded-xl text-xs space-y-1 sm:max-w-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Verified Role: {user?.role || 'ORGANIZATION_MEMBER'}
          </div>
          <p className="text-slate-400 text-[11px]">
            Created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
          </p>
        </div>
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
    </div>
  );
}
