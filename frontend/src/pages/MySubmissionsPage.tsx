import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Activity } from '../types';

export const MySubmissionsPage: React.FC = () => {
  const [tasks, setTasks] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'under_review' | 'approved' | 'changes_requested'>('all');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getActivities();
      // Only keep tasks that have submission history or under review / completed
      const submitted = res.filter(
        (t) => t.submitted_at || t.status === 'under_review' || t.status === 'completed' || t.submission_notes
      );
      setTasks(submitted);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'under_review') return t.status === 'under_review';
    if (filter === 'approved') return t.status === 'completed';
    if (filter === 'changes_requested') return t.status === 'on_hold' || t.status === 'blocked';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-7 h-7 text-teal-600" />
            My Task Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review status of all work deliverables submitted to Admin for approval.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          All Submissions ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('under_review')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'under_review' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Under Review ({tasks.filter((t) => t.status === 'under_review').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Approved ({tasks.filter((t) => t.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('changes_requested')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'changes_requested' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Changes Needed ({tasks.filter((t) => t.status === 'on_hold' || t.status === 'blocked').length})
        </button>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
          <p className="text-xs">Loading submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No submissions found</h3>
          <p className="text-xs text-slate-400 mt-1">Submit your completed tasks from the My Tasks page to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {item.activity_code || 'TASK'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                  item.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.status === 'on_hold' || item.status === 'blocked'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {item.status === 'completed' ? 'Approved' : item.status === 'under_review' ? 'Under Review' : 'Changes Requested'}
                </span>
              </div>

              {/* Submission Notes */}
              {item.submission_notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-1">Your Submission Notes:</span>
                  <p className="italic">{item.submission_notes}</p>
                </div>
              )}

              {/* Admin Feedback */}
              {item.admin_feedback && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MessageSquare size={13} className="text-amber-600" />
                    Admin Feedback:
                  </div>
                  <p>{item.admin_feedback}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span>
                    Submitted: {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : 'N/A'}
                  </span>
                  {item.approved_at && (
                    <span className="text-emerald-600 font-semibold">
                      Approved: {new Date(item.approved_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <span>Quantity: {item.actual_quantity || 1} / {item.target_quantity || 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
