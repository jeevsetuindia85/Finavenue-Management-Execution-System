import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  UserX,
  UserCheck,
  Trash2,
  Edit2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  BadgeCheck,
  Building,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { User, TeamMemberStats } from '../types';

export const AdminTeamPage: React.FC = () => {
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    username: '',
    password: '',
    role: 'team_member',
    department: 'Operations',
    designation: 'Associate',
    permissions: {
      hiring: true,
      expansion: true,
      product: true,
      reviews: false,
      reports: false
    }
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetUser, setResetUser] = useState<TeamMemberStats | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Edit Employee Modal
  const [editUser, setEditUser] = useState<TeamMemberStats | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    department: '',
    designation: '',
    role: 'team_member'
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.getTeamStats(),
        api.getUsers()
      ]);
      setTeamStats(statsRes);
      setUsers(usersRes);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate employee ID
  const openAddModal = () => {
    const nextNum = (teamStats.length + 1).toString().padStart(3, '0');
    setAddForm({
      full_name: '',
      email: '',
      employee_id: `FA-EMP-${nextNum}`,
      username: '',
      password: 'TempPassword123!',
      role: 'team_member',
      department: 'Operations',
      designation: 'Associate',
      permissions: {
        hiring: true,
        expansion: true,
        product: true,
        reviews: false,
        reports: false
      }
    });
    setAddError(null);
    setShowAddModal(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      await api.adminCreateEmployee({
        email: addForm.email,
        full_name: addForm.full_name,
        employee_id: addForm.employee_id,
        username: addForm.username || addForm.email.split('@')[0],
        password: addForm.password,
        role: addForm.role,
        department: addForm.department,
        designation: addForm.designation,
        permissions_json: JSON.stringify(addForm.permissions)
      });
      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to create employee account.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newTempPassword) return;

    try {
      setResetLoading(true);
      await api.adminResetPassword(resetUser.id, newTempPassword);
      alert(`Password for ${resetUser.full_name} (${resetUser.employee_id}) has been reset successfully!`);
      setResetUser(null);
      setNewTempPassword('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleStatus = async (user: TeamMemberStats) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = nextStatus === 'suspended'
      ? `Are you sure you want to SUSPEND ${user.full_name}? They will be blocked from logging in.`
      : `Reactivate account for ${user.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.adminToggleStatus(user.id, nextStatus as any);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle status.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setEditLoading(true);
      await api.adminUpdateEmployee(editUser.id, {
        full_name: editForm.full_name,
        department: editForm.department,
        designation: editForm.designation,
        role: editForm.role as any
      });
      setEditUser(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update employee details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (user: TeamMemberStats) => {
    if (!window.confirm(`Are you sure you want to delete/archive account for ${user.full_name} (${user.employee_id})?`)) return;
    try {
      await api.adminDeleteUser(user.id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  // Filtered members
  const filtered = teamStats.filter((m) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? m.status === 'active'
        : m.status === 'suspended';

    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.designation && m.designation.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const totalMembers = teamStats.length;
  const activeMembers = teamStats.filter(m => m.status === 'active').length;
  const suspendedMembers = teamStats.filter(m => m.status === 'suspended').length;
  const avgProductivity = totalMembers > 0
    ? Math.round(teamStats.reduce((acc, m) => acc + (m.productivity_pct || 0), 0) / totalMembers)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 font-bold text-xs border border-teal-500/20">
              Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-600" />
            User & Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized control: create employee IDs, issue login credentials, assign permissions, reset passwords, and monitor productivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition"
          >
            <UserPlus size={15} />
            + Add New Employee
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Total Team Members</div>
          <div className="text-2xl font-extrabold text-slate-900">{totalMembers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Authorized accounts</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Active Accounts</div>
          <div className="text-2xl font-extrabold text-emerald-600">{activeMembers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Can login & work</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Suspended Accounts</div>
          <div className="text-2xl font-extrabold text-rose-600">{suspendedMembers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Blocked from platform</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Avg Team Productivity</div>
          <div className="text-2xl font-extrabold text-teal-600">{avgProductivity}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Task completion rate</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-fit">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            All Members ({totalMembers})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Active ({activeMembers})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'suspended' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Suspended ({suspendedMembers})
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Team Member Directory & Productivity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Member Info</th>
                <th className="py-3 px-4">Dept & Designation</th>
                <th className="py-3 px-4">Role Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tasks (Assigned / Done / Overdue)</th>
                <th className="py-3 px-4 text-center">Productivity</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading team directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition">
                    {/* Employee ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-teal-800">
                        {member.employee_id}
                      </span>
                    </td>

                    {/* Member Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{member.full_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        {member.email}
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{member.department || 'Operations'}</div>
                      <div className="text-[11px] text-slate-400">{member.designation || 'Associate'}</div>
                    </td>

                    {/* Role Level */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        member.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : member.role === 'management'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'goal_owner'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.role?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        member.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>

                    {/* Tasks Summary */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <div className="inline-flex items-center gap-1.5 text-xs">
                        <span className="text-slate-800 font-bold" title="Assigned">{member.assigned_count}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-emerald-600 font-bold" title="Completed">{member.completed_count}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-600 font-bold" title="Overdue">{member.overdue_count}</span>
                      </div>
                    </td>

                    {/* Productivity Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-bold text-slate-900">{member.productivity_pct}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              member.productivity_pct >= 70 ? 'bg-emerald-500' : member.productivity_pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(member.productivity_pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditUser(member);
                            setEditForm({
                              full_name: member.full_name,
                              department: member.department,
                              designation: member.designation,
                              role: member.role
                            });
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setResetUser(member);
                            setNewTempPassword('NewPass123!');
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Toggle Status (Suspend / Reactivate) */}
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className={`p-1.5 rounded-lg transition ${
                            member.status === 'suspended'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-rose-500 hover:bg-rose-50'
                          }`}
                          title={member.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                        >
                          {member.status === 'suspended' ? <UserCheck size={13} /> : <UserX size={13} />}
                        </button>

                        {/* Delete / Archive User */}
                        {member.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete / Archive Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={16} className="text-teal-600" />
                Create New Team Member Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.employee_id}
                    onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value.toUpperCase() })}
                    placeholder="e.g. FA-EMP-003"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="e.g. rohit.sharma"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g. rohit@finavenue.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    placeholder="e.g. Talent Acquisition"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    placeholder="e.g. HR Recruiter"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Level
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="team_member">Team Member / Employee</option>
                    <option value="goal_owner">Goal Owner</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="management">Management</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound size={16} className="text-amber-600" />
              Reset Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set a temporary password for <strong>{resetUser.full_name}</strong> ({resetUser.employee_id}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                >
                  {resetLoading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Edit2 size={16} className="text-teal-600" />
              Edit Employee Details
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="team_member">Team Member / Employee</option>
                  <option value="goal_owner">Goal Owner</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="management">Management</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
