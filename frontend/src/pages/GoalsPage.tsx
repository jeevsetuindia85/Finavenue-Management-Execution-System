import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, AlertTriangle, Clock, ArrowRight, Shield, Layers, Calendar } from 'lucide-react';
import { Goal, GoalMilestone } from '../types';
import { api } from '../services/api';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_code: '',
    name: '',
    description: '',
    annual_target: '',
    priority: 'high',
    target_completion_date: '',
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.getGoals();
      setGoals(data);
      if (data.length > 0 && !selectedGoal) {
        setSelectedGoal(data[0]);
      } else if (selectedGoal) {
        const updated = data.find(g => g.id === selectedGoal.id);
        if (updated) setSelectedGoal(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.goal_code) return;
    try {
      await api.createGoal(newGoal as any);
      setShowCreateModal(false);
      setNewGoal({ goal_code: '', name: '', description: '', annual_target: '', priority: 'high', target_completion_date: '' });
      await fetchGoals();
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
            Goals & Strategic Objectives
          </h1>
          <p className="text-sm text-slate-500">
            Goal Master connecting annual target outcomes to weekly input measures and milestones
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <Plus size={15} />
          Create New Goal
        </button>
      </div>

      {/* Main Layout: Left Goal Cards, Right Detailed Drilldown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Goal Cards */}
        <div className="lg:col-span-5 space-y-3">
          {goals.map((g) => {
            const isSelected = selectedGoal?.id === g.id;
            const milestones = g.milestones || [];
            const avgProgress = milestones.length > 0
              ? Math.round(milestones.reduce((acc, m) => acc + (m.completion_percentage || 0), 0) / milestones.length)
              : 0;

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className={`p-5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                      {g.goal_code}
                    </span>
                    <PriorityBadge priority={g.priority} />
                  </div>
                  <span className="text-xs font-semibold capitalize text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {g.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{g.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{g.description || g.annual_target}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Milestones Completed</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all"
                      style={{ width: `${avgProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>Target: {g.target_completion_date || 'Q4 2026'}</span>
                  <span className="text-teal-600 font-semibold flex items-center gap-1">
                    Drill down <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Goal Detail & Milestones */}
        <div className="lg:col-span-7">
          {selectedGoal ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                      {selectedGoal.goal_code}
                    </span>
                    <PriorityBadge priority={selectedGoal.priority} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedGoal.name}</h2>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <span>Target Date</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedGoal.target_completion_date || 'Dec 31, 2026'}</p>
                </div>
              </div>

              {/* Annual Outcome Target */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Annual Target Outcome (Output KPI)
                </span>
                <p className="text-sm font-medium text-slate-800">
                  {selectedGoal.annual_target || selectedGoal.description}
                </p>
              </div>

              {/* Input Measures & Operating Principle */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/70 text-xs text-teal-900">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-teal-950">
                  <Shield size={14} className="text-teal-600" /> Operating Cadence & Input Measures
                </span>
                <span>
                  Execution is driven by mandatory weekly input activities. Progress is reviewed every Saturday
                  with a fallback on Tuesday.
                </span>
              </div>

              {/* Milestones Checklist */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-slate-600" />
                  Key Milestone Gates ({selectedGoal.milestones?.length || 0})
                </h3>

                <div className="space-y-2">
                  {(selectedGoal.milestones || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No milestones defined for this goal.</p>
                  ) : (
                    selectedGoal.milestones?.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-lg border border-slate-200/90 flex items-center justify-between text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              m.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.status === 'completed' ? '✓' : m.sort_order + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            {m.description && <p className="text-[11px] text-slate-500">{m.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 tabular-nums">{m.completion_percentage}%</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Select a goal to view details and milestones.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create Annual Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Goal Code (e.g. G04)</label>
                <input
                  type="text"
                  required
                  value={newGoal.goal_code}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="G04"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Institutional Client Acquisition"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Annual Target Outcome</label>
                <textarea
                  rows={2}
                  value={newGoal.annual_target}
                  onChange={(e) => setNewGoal({ ...newGoal, annual_target: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Specific output metrics to achieve by year end"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={newGoal.target_completion_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_completion_date: e.target.value })}
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
