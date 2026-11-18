import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Users,
  Target,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Briefcase,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { DashboardData } from '../types';
import { api } from '../services/api';
import { RAGBadge } from '../components/common/RAGBadge';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Aggregating live management metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error || 'Unable to retrieve dashboard data.'}
        </div>
      </div>
    );
  }

  const { kpis, goal_cards, alerts, charts } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Context & Rhythm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Executive Management Dashboard
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Annual Goals → Weekly Input Measures → Team Updates → Executive Review Cadence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
          >
            <Calendar size={14} className="text-teal-400" />
            Weekly Review Status
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <FileCheck size={14} className="text-slate-500" />
            Export MIS
          </Link>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Goals</span>
            <Target size={16} className="text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{kpis.total_active_goals}</span>
            <span className="text-xs text-emerald-600 font-medium">3 Core Initiatives</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Goals at Risk</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 tabular-nums">{kpis.goals_at_risk}</span>
            <span className="text-xs text-slate-500">Needs Intervention</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue Tasks</span>
            <Clock size={16} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 tabular-nums">{kpis.overdue_activities}</span>
            <span className="text-xs text-rose-500 font-medium">Past Deadline</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Due This Week</span>
            <Calendar size={16} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{kpis.activities_due_this_week}</span>
            <span className="text-xs text-slate-500">Pending Execution</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Wk</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">{kpis.activities_completed_this_week}</span>
            <span className="text-xs text-emerald-600 font-medium">Input Delivered</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Actions</span>
            <Briefcase size={16} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{kpis.pending_action_items}</span>
            <span className="text-xs text-slate-500">From Reviews</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Review Discipline</span>
            <ShieldAlert size={16} className="text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{kpis.weekly_review_compliance}%</span>
            <span className="text-xs text-teal-600 font-medium">Sat / Tue Cadence</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Goals Completed</span>
            <CheckCircle2 size={16} className="text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{kpis.completed_goals}</span>
            <span className="text-xs text-slate-400">Target 2026</span>
          </div>
        </div>
      </div>

      {/* Goal Overview Cards (3 Core Goals) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Target size={15} className="text-teal-600" />
            Core Annual Goals Overview
          </h2>
          <Link to="/goals" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            View Goal Master <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goal_cards.map((goal) => {
            const isG1 = goal.goal_code === 'G01';
            const isG2 = goal.goal_code === 'G02';
            const link = isG1 ? '/hiring' : isG2 ? '/expansion' : '/products';
            const tag = isG1 ? 'Talent Acquisition' : isG2 ? 'Ahmedabad & Bangalore' : 'PMS / CAT II';

            return (
              <div
                key={goal.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                      {goal.goal_code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                    {goal.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">Owner: <strong>{goal.owner_name || 'Unassigned'}</strong></p>

                  {/* Progress bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Milestone Progress</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{goal.milestone_completion_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(goal.milestone_completion_pct, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-center mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Done</span>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">{goal.activities_completed}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending</span>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{goal.activities_pending}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overdue</span>
                      <span className={`text-sm font-bold tabular-nums ${goal.activities_overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {goal.activities_overdue}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target: {goal.target_completion_date || 'Q4 2026'}</span>
                  <Link to={link} className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
                    Open Tracker <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intelligent Alerts Panel */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-500" />
              Intelligent Alerts & Operational Exceptions ({alerts.length})
            </h2>
            <span className="text-xs text-slate-400">Automated Business Control Engine</span>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  alert.severity === 'red'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      alert.severity === 'red' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                    }`}
                  ></span>
                  <div>
                    <span className="font-bold">{alert.title}: </span>
                    <span>{alert.message}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 shrink-0">
                  {alert.severity === 'red' ? 'Critical Action' : 'Attention'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 Recharts Analytics Visualizations */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={15} className="text-teal-600" />
          Execution Analytics & Visualizations
        </h2>

        {/* Charts Row 1: Weekly Planned vs Completed & Goal-wise Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Weekly Planned vs Completed Activities */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">1. Weekly Planned vs Completed Activities</h3>
                <p className="text-xs text-slate-500">Execution velocity across weekly reviews</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.weekly_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="planned" fill="#94A3B8" name="Planned Activities" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#0D9488" name="Completed Activities" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Goal-wise Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">2. Goal-wise Milestone Progress (%)</h3>
                <p className="text-xs text-slate-500">Hiring, Expansion, and Product launch progress</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.goal_progress || []} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="goal" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={40} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(val: any) => [`${val}%`, 'Completion']} />
                  <Bar dataKey="completion_pct" fill="#0EA5E9" radius={[0, 4, 4, 0]} name="Progress %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Team Performance & Task Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 3: Team-wise Performance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">3. Team Member Execution & Accountability</h3>
                <p className="text-xs text-slate-500">Assigned, completed, and overdue activities per owner</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.team_performance || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="assigned" fill="#64748B" name="Assigned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" fill="#EF4444" name="Overdue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Pending vs Overdue Tasks */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">4. Task Health Distribution</h3>
                <p className="text-xs text-slate-500">Live breakdown of active portfolio</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.task_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(charts.task_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 3: Hiring Funnel, Expansion, Product Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 5: Hiring Funnel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">5. Talent Acquisition Funnel</h3>
                <p className="text-xs text-slate-500">Sourced to Joining conversion</p>
              </div>
              <Link to="/hiring" className="text-xs text-teal-600 font-semibold hover:underline">Pipeline</Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.hiring_funnel || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="candidates" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Ahmedabad vs Bangalore Expansion */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">6. Ahmedabad vs Bangalore Setup</h3>
                <p className="text-xs text-slate-500">BD headcount target vs current</p>
              </div>
              <Link to="/expansion" className="text-xs text-teal-600 font-semibold hover:underline">Cities</Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.city_expansion || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="target_bd" fill="#94A3B8" name="Target Headcount" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current_bd" fill="#0D9488" name="Current Headcount" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 7: Product Milestone Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">7. Product Launch Readiness</h3>
                <p className="text-xs text-slate-500">PMS & CAT II Milestones Completed</p>
              </div>
              <Link to="/products" className="text-xs text-teal-600 font-semibold hover:underline">Products</Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.product_milestones || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="product" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="completed_milestones" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_milestones" fill="#CBD5E1" name="Total Milestones" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
