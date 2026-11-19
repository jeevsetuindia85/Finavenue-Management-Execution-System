import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Paperclip,
  Upload,
  Send,
  Play,
  Search,
  Filter,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Activity } from '../types';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Submit Modal
  const [activeTask, setActiveTask] = useState<Activity | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [actualQuantity, setActualQuantity] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Backend automatically enforces current_user scoping
      const res = await api.getActivities();
      setTasks(res);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartTask = async (taskId: string) => {
    try {
      await api.updateActivity(taskId, { status: 'in_progress' });
      await fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start task.');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    try {
      setSubmitting(true);
      // 1. Submit review
      await api.submitTaskForReview(activeTask.id, submissionNotes, actualQuantity);

      // 2. Upload file if attached
      if (selectedFile) {
        await api.uploadTaskAttachment(activeTask.id, selectedFile);
      }

      setActiveTask(null);
      setSubmissionNotes('');
      setSelectedFile(null);
      await fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit task for review.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'in_progress'
        ? t.status === 'in_progress'
        : filterStatus === 'assigned'
        ? t.status === 'assigned' || t.status === 'todo'
        : filterStatus === 'under_review'
        ? t.status === 'under_review'
        : filterStatus === 'completed'
        ? t.status === 'completed'
        : filterStatus === 'on_hold'
        ? t.status === 'on_hold' || t.status === 'blocked'
        : true;

    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.activity_code && t.activity_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-7 h-7 text-teal-600" />
            My Assigned Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Private workspace: view tasks assigned to you by Admin, submit deliverables, and track review feedback.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {[
            { id: 'all', label: 'All Tasks', count: tasks.length },
            { id: 'assigned', label: 'Assigned', count: tasks.filter(t => t.status === 'assigned' || t.status === 'todo').length },
            { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
            { id: 'under_review', label: 'Under Review', count: tasks.filter(t => t.status === 'under_review').length },
            { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
            { id: 'on_hold', label: 'Action Needed', count: tasks.filter(t => t.status === 'on_hold' || t.status === 'blocked').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
          <p className="text-xs">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-400 mt-1">No tasks match your selected filter or search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {task.activity_code || 'TASK'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      task.priority === 'critical' || task.priority === 'high'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'under_review'
                        ? 'bg-indigo-100 text-indigo-800'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : task.status === 'on_hold' || task.status === 'blocked'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{task.name}</h3>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {(task.status === 'assigned' || task.status === 'todo') && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Play size={12} />
                      Start Work
                    </button>
                  )}

                  {(task.status === 'in_progress' || task.status === 'on_hold') && (
                    <button
                      onClick={() => {
                        setActiveTask(task);
                        setSubmissionNotes(task.submission_notes || '');
                        setActualQuantity(task.actual_quantity || 1);
                        setSelectedFile(null);
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Send size={12} />
                      Submit for Review
                    </button>
                  )}

                  {task.status === 'under_review' && (
                    <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Clock size={12} />
                      Awaiting Admin Approval
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      Approved
                    </div>
                  )}
                </div>
              </div>

              {/* Description / Instructions */}
              {task.description && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Admin Instructions:</span>
                  <p className="whitespace-pre-line">{task.description}</p>
                </div>
              )}

              {/* Admin Feedback Box (if changes requested or comment left) */}
              {task.admin_feedback && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MessageSquare size={13} className="text-amber-600" />
                    Admin Feedback & Notes:
                  </div>
                  <p className="italic">{task.admin_feedback}</p>
                </div>
              )}

              {/* Metadata footer */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    Due: <strong>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}</strong>
                  </span>
                  <span>
                    Frequency: <strong className="capitalize">{task.target_frequency || 'milestone'}</strong>
                  </span>
                  <span>
                    Target: <strong>{task.actual_quantity || 0} / {task.target_quantity || 1}</strong>
                  </span>
                </div>

                {task.submitted_at && (
                  <span className="text-indigo-600 font-medium">
                    Submitted on: {new Date(task.submitted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Work Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send size={16} className="text-teal-600" />
                Submit Task for Admin Review
              </h3>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{activeTask.activity_code || 'TASK'}</span>
              <h4 className="text-sm font-bold text-slate-800">{activeTask.name}</h4>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Notes / Proof of Work <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Detail the work done, outcomes, candidate names, or verification links for Admin review..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Completed
                </label>
                <input
                  type="number"
                  min="1"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Supporting Document (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-teal-600 hover:underline">
                      {selectedFile ? selectedFile.name : 'Choose a file to attach'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, XLSX, PNG up to 10MB</p>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
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
