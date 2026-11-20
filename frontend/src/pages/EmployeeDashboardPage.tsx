import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  ListTodo,
  TrendingUp,
  ArrowRight,
  Send,
  Calendar,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { EmployeeDashboardData, Activity } from '../types';

export const EmployeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit Modal state
  const [selectedTask, setSelectedTask] = useState<Activity | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEmployeeMetrics();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load employee metrics:', err);
      setError('Could not load your personal dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      setSubmitting(true);
      await api.submitTaskForReview(selectedTask.id, submissionNotes);
      setSelectedTask(null);
      setSubmissionNotes('');
      await fetchMetrics();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit task for review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Loading your workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900 mb-1">Dashboard Unavailable</h3>
        <p className="text-sm text-rose-700 mb-4">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const user = data.user || (data as any).employee || {
    employee_id: 'FA-EMP-001',
    full_name: 'Team Member',
    department: 'Operations',
    designation: 'Team Member'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute right-0 top-0 w-96 h-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/30">
                {user.employee_id}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {user.department || 'Operations'} &middot; {user.designation || 'Team Member'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.full_name}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Track your daily tasks, submit completed work for Admin review, and review real-time feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-tasks')}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition"
            >
              <ListTodo size={15} />
              Open My Tasks ({data.pending_tasks})
            </button>
            <button
              onClick={() => navigate('/my-submissions')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
            >
              <Send size={14} />
              My Submissions
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Assigned */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Assigned</span>
            <ListTodo size={16} className="text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_assigned}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total tasks</div>
        </div>

        {/* Due Today */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Due Today</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{data.today_tasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Immediate focus</div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{data.pending_tasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active tasks</div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Under Review</span>
            <FileCheck2 size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{data.under_review_tasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting approval</div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{data.completed_tasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Approved by Admin</div>
        </div>

        {/* Productivity % */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Productivity</span>
            <ShieldCheck size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600">{data.productivity_pct}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Completion rate</div>
        </div>
      </div>

      {/* Main Sections: Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Deadlines & Active Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Upcoming Deadlines & Actions</h2>
              </div>
              <button
                onClick={() => navigate('/my-tasks')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                View all tasks <ArrowRight size={12} />
              </button>
            </div>

            {data.upcoming_deadlines.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-medium">No pending deadlines! You're completely caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcoming_deadlines.map((task) => (
                  <div key={task.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-lg transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {task.activity_code || 'TASK'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          task.priority === 'critical' || task.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                        {task.status === 'under_review' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            Under Review
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{task.name}</h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">Status: {task.status.replace('_', ' ')}</div>
                      </div>

                      {task.status !== 'under_review' && task.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setSubmissionNotes('');
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Send size={12} />
                          Submit Work
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Submissions & Feedback */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Admin Feedback & Submissions</h2>
              </div>
              <button
                onClick={() => navigate('/my-submissions')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
              >
                All
              </button>
            </div>

            {data.recent_submissions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent task submissions.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent_submissions.map((task) => (
                  <div key={task.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">{task.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'on_hold'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {task.status === 'completed' ? 'Approved' : task.status === 'on_hold' ? 'Changes Needed' : 'Under Review'}
                      </span>
                    </div>

                    {task.submission_notes && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 italic">
                        "Your note: {task.submission_notes}"
                      </p>
                    )}

                    {task.admin_feedback && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                        <strong>Admin Feedback:</strong> {task.admin_feedback}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      Submitted: {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Work Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send size={16} className="text-teal-600" />
                Submit Task for Admin Review
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{selectedTask.activity_code || 'TASK'}</span>
              <h4 className="text-sm font-bold text-slate-800">{selectedTask.name}</h4>
              {selectedTask.description && (
                <p className="text-xs text-slate-600 mt-1">{selectedTask.description}</p>
              )}
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Notes / Work Done <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Detail the work completed, links, or deliverables for Admin verification..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !submissionNotes.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
