import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Phone, Briefcase, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

export const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'team_member',
    job_title: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.full_name) return;
    try {
      await api.inviteUser(inviteForm.email, inviteForm.full_name, inviteForm.role, inviteForm.job_title);
      setShowInviteModal(false);
      setInviteForm({ email: '', full_name: '', role: 'team_member', job_title: '' });
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Team Management & Access Roles
          </h1>
          <p className="text-sm text-slate-500">
            Role-based collaboration: Management, Goal Owners, Team Members, and Coordinator (Maitwayi)
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <UserPlus size={14} /> Invite Team Member
        </button>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Management</span>
          <span className="text-xl font-bold text-slate-900">{users.filter(u => u.role === 'management').length} Executive(s)</span>
          <p className="text-xs text-slate-500 mt-1">Full strategic visibility & approval rights</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Goal Owners</span>
          <span className="text-xl font-bold text-slate-900">{users.filter(u => u.role === 'goal_owner').length} Owners</span>
          <p className="text-xs text-slate-500 mt-1">Own Hiring, Expansion & Products</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Coordinator</span>
          <span className="text-xl font-bold text-teal-600">Maitwayi Desai</span>
          <p className="text-xs text-slate-500 mt-1">Prepares reviews & drives follow-ups</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Team Members</span>
          <span className="text-xl font-bold text-slate-900">{users.filter(u => u.role === 'team_member').length} Members</span>
          <p className="text-xs text-slate-500 mt-1">Execute activities & submit evidence</p>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Name / Member</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Job Title</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {u.full_name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{u.full_name}</span>
                      <span className="text-[10px] text-slate-400">{u.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'management'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : u.role === 'coordinator'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : u.role === 'goal_owner'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-700">{u.job_title || '—'}</td>
                <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Active'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="r.sharma@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="team_member">Team Member</option>
                    <option value="goal_owner">Goal Owner</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior BD Manager"
                    value={inviteForm.job_title}
                    onChange={(e) => setInviteForm({ ...inviteForm, job_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
