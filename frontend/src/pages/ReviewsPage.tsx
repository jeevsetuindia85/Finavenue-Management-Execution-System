import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  Target,
  FileText,
  ChevronRight,
  ShieldAlert,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { WeeklyReview, ActionItem, User } from '../types';
import { api } from '../services/api';

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<WeeklyReview | null>(null);
  const [showConductModal, setShowConductModal] = useState(false);

  // Form states
  const [reviewForm, setReviewForm] = useState({
    week_start_date: new Date().toISOString().split('T')[0],
    scheduled_date: '',
    actual_meeting_date: new Date().toISOString().split('T')[0],
    goals_reviewed: 'G01 (Hiring), G02 (Expansion), G03 (Products)',
    major_challenges: '',
    decisions: '',
    meeting_notes: '',
    action_item_desc: '',
    action_item_responsible: '',
    action_item_due: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revData, userData] = await Promise.all([
        api.getReviews(),
        api.getUsers(),
      ]);
      setReviews(revData);
      setUsers(userData);
      if (revData.length > 0 && !selectedReview) {
        setSelectedReview(revData[0]);
      } else if (selectedReview) {
        const updated = revData.find((r) => r.id === selectedReview.id);
        if (updated) setSelectedReview(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConductReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        week_start_date: reviewForm.week_start_date,
        scheduled_date: reviewForm.scheduled_date || reviewForm.week_start_date,
        actual_meeting_date: reviewForm.actual_meeting_date,
        goals_reviewed: reviewForm.goals_reviewed,
        major_challenges: reviewForm.major_challenges,
        decisions: reviewForm.decisions,
        meeting_notes: reviewForm.meeting_notes,
      };

      if (reviewForm.action_item_desc) {
        payload.action_items = [
          {
            description: reviewForm.action_item_desc,
            responsible_id: reviewForm.action_item_responsible || undefined,
            due_date: reviewForm.action_item_due || undefined,
          },
        ];
      }

      await api.createReview(payload);
      setShowConductModal(false);
      await fetchData();
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

  // Determine cadence alert status
  const latestReview = reviews[0];
  const isConducted = latestReview?.conducted;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Weekly Review & Meeting Cadence
          </h1>
          <p className="text-sm text-slate-500">
            Mandatory business control: Saturday primary meeting → Tuesday fallback → Red Alert escalation
          </p>
        </div>
        <button
          onClick={() => setShowConductModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <Plus size={14} /> Conduct & Record Review
        </button>
      </div>

      {/* Cadence Control Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CalendarCheck2 size={15} className="text-teal-600" />
            Cadence Rule Engine Status
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Weekly Discipline Control
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="font-bold text-slate-800 text-xs">Primary Review Day</span>
            </div>
            <p className="text-xs text-slate-600">Every <strong>SATURDAY</strong></p>
            <span className="text-[11px] text-slate-400 block mt-1">Review active goals, input activities, and agency status</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-bold text-slate-800 text-xs">Fallback Review Day</span>
            </div>
            <p className="text-xs text-slate-600">Following <strong>TUESDAY</strong></p>
            <span className="text-[11px] text-slate-400 block mt-1">Mandatory fallback if Saturday meeting could not convene</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-bold text-slate-800 text-xs">Exception Trigger</span>
            </div>
            <p className="text-xs text-rose-600 font-bold">RED ALERT</p>
            <span className="text-[11px] text-slate-400 block mt-1">Triggered automatically if Tuesday review is also missed</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Review History List & Selected Meeting Minutes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Historical Reviews */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Weekly Review Records ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No review records found. Click "Conduct & Record Review" above.
            </div>
          ) : (
            reviews.map((r) => {
              const isSelected = selectedReview?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReview(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Week of {r.week_start_date}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.conducted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.conducted ? 'Conducted' : 'Scheduled'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 my-1.5">
                    {r.decisions || r.meeting_notes || 'Goals reviewed: Hiring, Expansion, Products'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Meeting: {r.actual_meeting_date || r.scheduled_date}</span>
                    <span className="font-semibold text-slate-700">
                      {r.action_items?.length || 0} Action Items
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Minutes & Action Items */}
        <div className="lg:col-span-7">
          {selectedReview ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 mb-1 inline-block">
                    Review Meeting Minutes
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Week of {selectedReview.week_start_date}
                  </h3>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">Actual Meeting Date</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedReview.actual_meeting_date || selectedReview.scheduled_date}
                  </span>
                </div>
              </div>

              {/* Goals Reviewed */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Goals Reviewed
                </span>
                <p className="text-xs font-medium text-slate-800">
                  {selectedReview.goals_reviewed || 'G01 (Hiring), G02 (Expansion), G03 (Product Development)'}
                </p>
              </div>

              {/* Decisions & Challenges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <span className="font-bold text-emerald-950 block mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Key Decisions Taken
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedReview.decisions || 'Decisions recorded during the weekly executive cadence.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
                  <span className="font-bold text-amber-950 block mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-600" /> Challenges & Bottlenecks
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedReview.major_challenges || 'No major execution bottlenecks flagged.'}
                  </p>
                </div>
              </div>

              {/* Action Items Arising */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <CalendarCheck2 size={13} className="text-slate-600" />
                  Assigned Action Items ({selectedReview.action_items?.length || 0})
                </h4>

                <div className="space-y-2">
                  {(selectedReview.action_items || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No action items assigned for this review.</p>
                  ) : (
                    selectedReview.action_items?.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200/90 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
                          <span className="font-medium text-slate-800">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 tabular-nums font-semibold">
                            Due: {item.due_date || 'Next Saturday'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Select a review meeting to view minutes and action items.
            </div>
          )}
        </div>
      </div>

      {/* Conduct Review Modal */}
      {showConductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Conduct & Record Weekly Review</h2>
            <p className="text-xs text-slate-500 mb-4">Record management decisions and action items</p>

            <form onSubmit={handleConductReview} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Review Week Start</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.week_start_date}
                    onChange={(e) => setReviewForm({ ...reviewForm, week_start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Actual Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.actual_meeting_date}
                    onChange={(e) => setReviewForm({ ...reviewForm, actual_meeting_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Goals Reviewed</label>
                <input
                  type="text"
                  value={reviewForm.goals_reviewed}
                  onChange={(e) => setReviewForm({ ...reviewForm, goals_reviewed: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Key Decisions Taken</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Record formal management decisions approved"
                  value={reviewForm.decisions}
                  onChange={(e) => setReviewForm({ ...reviewForm, decisions: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Challenges & Blockers</label>
                <textarea
                  rows={2}
                  placeholder="Dependencies, hiring bottlenecks, commercial negotiations"
                  value={reviewForm.major_challenges}
                  onChange={(e) => setReviewForm({ ...reviewForm, major_challenges: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="font-semibold text-slate-800 block mb-1">Add Priority Action Item</label>
                <input
                  type="text"
                  placeholder="Deliverable description"
                  value={reviewForm.action_item_desc}
                  onChange={(e) => setReviewForm({ ...reviewForm, action_item_desc: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reviewForm.action_item_responsible}
                    onChange={(e) => setReviewForm({ ...reviewForm, action_item_responsible: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    <option value="">Responsible Person</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={reviewForm.action_item_due}
                    onChange={(e) => setReviewForm({ ...reviewForm, action_item_due: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConductModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Record Review Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
