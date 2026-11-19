import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  User,
  BadgeCheck
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

export const MyProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const u = await api.getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }

    try {
      setPwdLoading(true);
      await api.changePassword(currentPassword, newPassword);
      setPwdSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-teal-600" />
          My Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View your corporate credentials, assignment details, and manage your account password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-teal-400 font-extrabold text-2xl flex items-center justify-center mx-auto border-2 border-teal-500/30">
            {user.full_name ? user.full_name[0] : 'U'}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-mono font-bold border border-teal-200">
            <BadgeCheck size={14} />
            {user.employee_id || 'FA-EMP-001'}
          </div>

          <div className="pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="font-semibold text-slate-800">{user.department || 'Execution'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Designation:</span>
              <span className="font-semibold text-slate-800">{user.designation || 'Team Member'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role Level:</span>
              <span className="font-semibold text-slate-800 capitalize">{user.role?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                {user.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Change Password & Security Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
            </div>

            {pwdSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                {pwdSuccess}
              </div>
            )}

            {pwdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new strong password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  <KeyRound size={14} />
                  {pwdLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">Security Policy & Isolation</span>
              <p className="mt-0.5">
                Your account is protected by role-based data encryption and session isolation. You only have access to tasks assigned to your employee ID. Repeated failed attempts trigger temporary lockout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
