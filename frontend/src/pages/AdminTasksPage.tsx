import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Send,
  MessageSquare,
  FileCheck2,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { Activity, User as UserType } from '../types';

export const AdminTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    due_date: '',
    target_frequency: 'weekly' as 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'milestone',
    target_quantity: 1,
    module: 'general' as 'hiring' | 'expansion' | 'product' | 'general'
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Review Modal
  const [reviewTask, setReviewTask] = useState<Activity | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes] = await Promise.all([
        api.getActivities(),
        api.getUsers()
      ]);
      setTasks(tasksRes);
      setUsers(usersRes);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name) return;

    try {
      setCreateLoading(true);
      await api.createActivity({
        name: createForm.name,
        description: createForm.description,
        assigned_to: createForm.assigned_to || undefined,
        priority: createForm.priority,
        due_date: createForm.due_date || undefined,
        target_frequency: createForm.target_frequency,
        target_quantity: Number(createForm.target_quantity) || 1,
        actual_quantity: 0,
        status: 'assigned',
        rag_status: 'green',
        module: createForm.module
      });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
        target_frequency: 'weekly',
        target_quantity: 1,
        module: 'general'
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTask) return;

    try {
      setReviewLoading(true);
      const action = reviewAction === 'approve' ? 'approve' : 'request_changes';
      await api.adminReviewTask(reviewTask.id, action, adminFeedback);
      setReviewTask(null);
      setAdminFeedback('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to review task.');
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'under_review'
        ? t.status === 'under_review'
        : statusFilter === 'completed'
        ? t.status === 'completed'
        : statusFilter === 'in_progress'
        ? t.status === 'in_progress'
        : statusFilter === 'assigned'
        ? t.status === 'assigned' || t.status === 'todo'
        : statusFilter === 'on_hold'
        ? t.status === 'on_hold' || t.status === 'blocked'
        : true;

    const matchesAssignee =
      assigneeFilter === 'all'
        ? true
        : String(t.assigned_to) === String(assigneeFilter);

    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.activity_code && t.activity_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assignee?.full_name && t.assignee.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesAssignee && matchesSearch;
  });

  const totalTasks = tasks.length;
  const underReviewCount = tasks.filter((t) => t.status === 'under_review').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter((t) => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 font-bold text-xs border border-teal-500/20">
              Admin Control Center
            </span>
            {underReviewCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] animate-pulse">
                {underReviewCount} Work Pending Review
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-teal-600" />
            Central Task Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create tasks, allocate to employees, inspect deliverables, review submissions, and approve or request changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition"
          >
            <Plus size={15} />
            + Create & Assign Task
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Total Tasks</div>
          <div className="text-2xl font-extrabold text-slate-900">{totalTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">In Progress</div>
          <div className="text-2xl font-extrabold text-blue-600">{inProgressCount}</div>
        </div>
        <div className={`p-4 rounded-xl border shadow-xs transition ${
          underReviewCount > 0 ? 'bg-indigo-50/70 border-indigo-200' : 'bg-white border-slate-200'
        }`}>
          <div className="text-indigo-600 text-xs font-bold mb-1 flex items-center gap-1">
            <Clock size={12} />
            Under Review
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">{underReviewCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Completed</div>
          <div className="text-2xl font-extrabold text-emerald-600">{completedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Overdue</div>
          <div className="text-2xl font-extrabold text-rose-600">{overdueCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'under_review', label: `Under Review (${underReviewCount})` },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'completed', label: 'Completed' },
            { id: 'on_hold', label: 'On Hold' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                statusFilter === tab.id ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignee & Search */}
        <div className="flex items-center gap-2">
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.employee_id || 'ID'})
              </option>
            ))}
          </select>

          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Task Code</th>
                <th className="py-3 px-4">Task Details</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No tasks match the filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition">
                    {/* Task Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-teal-900">
                        {task.activity_code || 'TASK'}
                      </span>
                    </td>

                    {/* Task Name & Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{task.name}</div>
                      {task.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {task.description}
                        </div>
                      )}
                      {task.submission_notes && (
                        <div className="mt-1 text-[10px] text-indigo-700 font-medium bg-indigo-50/70 p-1 rounded border border-indigo-100">
                          <strong>Note:</strong> {task.submission_notes}
                        </div>
                      )}
                    </td>

                    {/* Assigned Employee */}
                    <td className="py-3.5 px-4">
                      {task.assignee ? (
                        <div>
                          <div className="font-semibold text-slate-800">{task.assignee.full_name}</div>
                          <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-100">
                            {task.assignee.employee_id || 'FA-EMP'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'critical' || task.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'under_review'
                          ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : task.status === 'on_hold' || task.status === 'blocked'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Review / Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {task.status === 'under_review' ? (
                        <button
                          onClick={() => {
                            setReviewTask(task);
                            setReviewAction('approve');
                            setAdminFeedback('');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 ml-auto transition"
                        >
                          <FileCheck2 size={13} />
                          Review Work
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          {task.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setReviewTask(task);
                                setReviewAction('approve');
                                setAdminFeedback('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Mark Approved / Completed"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={16} className="text-indigo-600" />
                Review Employee Deliverable
              </h3>
              <button
                onClick={() => setReviewTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{reviewTask.activity_code || 'TASK'}</span>
                <h4 className="text-sm font-bold text-slate-800">{reviewTask.name}</h4>
                <div className="text-xs text-slate-500 mt-1">
                  Assigned to: <strong>{reviewTask.assignee?.full_name} ({reviewTask.assignee?.employee_id})</strong>
                </div>
              </div>

              {/* Employee's Submission Notes */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <span className="text-xs font-bold text-indigo-900 block mb-1">
                  Employee Submission Deliverable:
                </span>
                <p className="text-xs text-indigo-950 whitespace-pre-line font-medium">
                  {reviewTask.submission_notes || 'No submission notes provided.'}
                </p>
                {reviewTask.submitted_at && (
                  <div className="text-[10px] text-indigo-500 mt-2">
                    Submitted on: {new Date(reviewTask.submitted_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Approve Task
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      reviewAction === 'reject'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle size={14} />
                    Request Changes / Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Feedback / Remarks
                </label>
                <textarea
                  rows={3}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional praise or confirmation notes...'
                      : 'Provide specific feedback on what needs revision...'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50 ${
                    reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewLoading ? 'Saving...' : reviewAction === 'approve' ? 'Approve & Mark Done' : 'Return for Revisions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-teal-600" />
                Create and Assign Task
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Conduct reference checks for Senior Analyst"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignee (Team Member) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={createForm.assigned_to}
                  onChange={(e) => setCreateForm({ ...createForm, assigned_to: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="">Select team member...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.employee_id}) — {u.department || u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions & Deliverable Description
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Provide detailed instructions and guidelines for the employee..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline (Due Date)
                  </label>
                  <input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cadence / Frequency
                  </label>
                  <select
                    value={createForm.target_frequency}
                    onChange={(e) => setCreateForm({ ...createForm, target_frequency: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Deliverable Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.target_quantity}
                    onChange={(e) => setCreateForm({ ...createForm, target_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {createLoading ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
