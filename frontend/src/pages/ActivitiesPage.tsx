import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  MessageSquare,
  History,
  CheckCircle2,
  ChevronRight,
  X,
  Search,
  Tag
} from 'lucide-react';
import { Activity, ActivityUpdate, Goal, User as UserType } from '../types';
import { api } from '../services/api';
import { RAGBadge } from '../components/common/RAGBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'due_today' | 'due_week' | 'overdue' | 'completed'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Selected Activity Drawer
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityUpdates, setActivityUpdates] = useState<ActivityUpdate[]>([]);
  const [newComment, setNewComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    goal_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    target_frequency: 'weekly',
    target_quantity: 1,
    module: 'general',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actsData, goalsData, usersData] = await Promise.all([
        api.getActivities(),
        api.getGoals(),
        api.getUsers(),
      ]);
      setActivities(actsData);
      setGoals(goalsData);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectActivity = async (act: Activity) => {
    setSelectedActivity(act);
    try {
      const updates = await api.getActivityUpdates(act.id);
      setActivityUpdates(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name) return;
    try {
      await api.createActivity(newTask as any);
      setShowCreateModal(false);
      setNewTask({
        name: '',
        description: '',
        goal_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
        target_frequency: 'weekly',
        target_quantity: 1,
        module: 'general',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (activityId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await api.updateActivity(activityId, { status: newStatus as any });
      setActivities(activities.map(a => a.id === activityId ? updated : a));
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(updated);
        const updates = await api.getActivityUpdates(activityId);
        setActivityUpdates(updates);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !newComment.trim()) return;
    try {
      await api.addActivityComment(selectedActivity.id, newComment);
      setNewComment('');
      const updates = await api.getActivityUpdates(selectedActivity.id);
      setActivityUpdates(updates);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const today = new Date().toISOString().split('T')[0];
  const filteredActivities = activities.filter((act) => {
    // Module filter
    if (moduleFilter !== 'all' && act.module !== moduleFilter) return false;
    
    // Search
    if (search && !act.name.toLowerCase().includes(search.toLowerCase()) && !act.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Tabs
    if (activeTab === 'completed') return act.status === 'completed';
    if (activeTab === 'overdue') return act.status !== 'completed' && act.due_date && act.due_date < today;
    if (activeTab === 'due_today') return act.status !== 'completed' && act.due_date === today;
    if (activeTab === 'due_week') {
      if (!act.due_date || act.status === 'completed') return false;
      const d = new Date(act.due_date);
      const diff = (d.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    }
    return true;
  });

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
            Central Activity Tracker
          </h1>
          <p className="text-sm text-slate-500">
            Measurable weekly inputs, assignment accountability, RAG status and complete audit trail
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <Plus size={15} />
          Create Activity
        </button>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'due_today', label: 'Due Today' },
            { id: 'due_week', label: 'Due This Week' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 text-xs">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Modules</option>
            <option value="hiring">Hiring</option>
            <option value="expansion">Expansion</option>
            <option value="product">Product</option>
            <option value="general">General</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">RAG</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Progress / Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No activities match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isOverdue = act.status !== 'completed' && act.due_date && act.due_date < today;
                  return (
                    <tr
                      key={act.id}
                      onClick={() => handleSelectActivity(act)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <RAGBadge status={act.rag_status} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {act.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                          {act.module || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {act.assignee?.full_name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={act.priority} />
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {act.due_date || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {act.target_quantity ? `${act.actual_quantity} / ${act.target_quantity}` : `${act.actual_quantity}`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            act.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : act.status === 'in_progress'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {act.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(act.id, act.status === 'completed' ? 'in_progress' : 'completed');
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                            act.status === 'completed'
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {act.status === 'completed' ? 'Reopen' : 'Complete'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Detail Drawer */}
      {selectedActivity && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-112 bg-white border-l border-slate-200 z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <RAGBadge status={selectedActivity.rag_status} />
                <h2 className="text-base font-bold text-slate-900 mt-2">{selectedActivity.name}</h2>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="font-semibold capitalize text-slate-800">{selectedActivity.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Priority</span>
                <PriorityBadge priority={selectedActivity.priority} />
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Due Date</span>
                <span className="font-semibold text-slate-800">{selectedActivity.due_date || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Module</span>
                <span className="font-semibold capitalize text-slate-800">{selectedActivity.module || 'General'}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Description & Target
              </span>
              <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                {selectedActivity.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Status Change CTA */}
            <div className="flex gap-2">
              {['todo', 'in_progress', 'completed', 'blocked'].map((st) => (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(selectedActivity.id, st)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize border transition ${
                    selectedActivity.status === st
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Audit History & Updates */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <History size={13} className="text-slate-500" />
                Audit Trail & History ({activityUpdates.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activityUpdates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No updates recorded yet.</p>
                ) : (
                  activityUpdates.map((up) => (
                    <div key={up.id} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                      <div className="flex justify-between text-slate-500 text-[10px] mb-1">
                        <span>Status: <strong>{up.previous_status || 'start'} → {up.new_status}</strong></span>
                        <span>{new Date(up.created_at).toLocaleDateString()}</span>
                      </div>
                      {up.notes && <p className="text-slate-700">{up.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-slate-500" />
                Add Comment / Evidence
              </span>
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Record outcome, meeting notes or evidence..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Post Comment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Create New Activity</h2>
            <form onSubmit={handleCreateActivity} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Activity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agency Follow-up for Senior BD"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Target Outcome</label>
                <textarea
                  rows={2}
                  placeholder="Specific weekly deliverables or target count"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Goal Alignment</label>
                  <select
                    value={newTask.goal_id}
                    onChange={(e) => setNewTask({ ...newTask, goal_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Goal (optional)</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.goal_code}: {g.name.slice(0, 24)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Module</label>
                  <select
                    value={newTask.module}
                    onChange={(e) => setNewTask({ ...newTask, module: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="general">General</option>
                    <option value="hiring">Hiring (Goal 01)</option>
                    <option value="expansion">Expansion (Goal 02)</option>
                    <option value="product">Product (Goal 03)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Assignee</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newTask.target_quantity}
                    onChange={(e) => setNewTask({ ...newTask, target_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Create Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
