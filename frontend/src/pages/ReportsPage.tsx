import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Layers,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';

export const ReportsPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard report preview', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (type: 'excel' | 'pdf' | 'csv', entity?: string) => {
    const key = `${type}-${entity || ''}`;
    setDownloading(key);
    try {
      let url = '';
      let filename = '';
      if (type === 'excel') {
        url = api.getExcelExportUrl();
        filename = `ExecFlow_Master_Execution_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (type === 'pdf') {
        url = api.getPdfExportUrl();
        filename = `ExecFlow_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'csv' && entity) {
        url = api.getCsvExportUrl(entity);
        filename = `ExecFlow_${entity}_${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Fetch with token
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed with HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message || 'Please check backend status'}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Executive Export</h1>
          <p className="text-sm text-slate-500 mt-1">
            Export comprehensive management data in multi-sheet Excel (.xlsx), professional PDF briefing, or standardized CSV formats.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadFile('excel')}
            disabled={downloading === 'excel-'}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {downloading === 'excel-' ? 'Generating Excel...' : 'Export Complete Excel (.xlsx)'}
          </button>
          <button
            onClick={() => downloadFile('pdf')}
            disabled={downloading === 'pdf-'}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {downloading === 'pdf-' ? 'Generating PDF...' : 'Executive Briefing PDF'}
          </button>
        </div>
      </div>

      {/* Primary Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-emerald-300 transition">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-base">Full Management Workbook</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">.xlsx</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Multi-tab comprehensive Excel spreadsheet containing all active and historical execution data across the firm.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Goals & KPIs</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Activity Registry</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Candidate Pipeline</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Coworking Proposals</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Product Milestones</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Weekly Review Minutes</div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Powered by openpyxl &middot; Real-time dynamic export</span>
                <button
                  onClick={() => downloadFile('excel')}
                  disabled={downloading === 'excel-'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-400 transition">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-base">Executive Management Briefing</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-800">.pdf</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executive-ready formatted printable PDF document summarizing strategic goals, milestone completion, and weekly review decisions.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-700" /> Strategic KPI Summary</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-700" /> 3 Core Goal Deep-Dives</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-700" /> Overdue & At-Risk Items</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-700" /> Governance Compliance</div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Powered by ReportLab &middot; Vector graphics ready</span>
                <button
                  onClick={() => downloadFile('pdf')}
                  disabled={downloading === 'pdf-'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 text-base mb-1">Standardized CSV Data Exports</h3>
        <p className="text-xs text-slate-500 mb-5">
          Clean comma-separated value files ready for business intelligence tools, PowerBI, Tableau, or data pipelines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity Execution</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">CSV</span>
              </div>
              <h4 className="font-medium text-slate-900 text-sm">Activities & Tasks</h4>
              <p className="text-xs text-slate-500 mt-1">Full activity registry with assignees, priorities, due dates, statuses, and target vs actual metrics.</p>
            </div>
            <button
              onClick={() => downloadFile('csv', 'activities')}
              disabled={downloading === 'csv-activities'}
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading === 'csv-activities' ? 'Exporting...' : 'Export Activities CSV'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hiring Funnel</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">CSV</span>
              </div>
              <h4 className="font-medium text-slate-900 text-sm">Candidates & Recruitment</h4>
              <p className="text-xs text-slate-500 mt-1">Complete talent database with position applied, sourcing channel, agency, stage, CTC, and notice periods.</p>
            </div>
            <button
              onClick={() => downloadFile('csv', 'candidates')}
              disabled={downloading === 'csv-candidates'}
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading === 'csv-candidates' ? 'Exporting...' : 'Export Candidates CSV'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Office Expansion</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">CSV</span>
              </div>
              <h4 className="font-medium text-slate-900 text-sm">Coworking Space Proposals</h4>
              <p className="text-xs text-slate-500 mt-1">Side-by-side commercial proposals for Ahmedabad and Bangalore: seats, monthly rents, deposits, site visits.</p>
            </div>
            <button
              onClick={() => downloadFile('csv', 'coworking')}
              disabled={downloading === 'csv-coworking'}
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading === 'csv-coworking' ? 'Exporting...' : 'Export Coworking CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Data Summary for Report Validation */}
      {dashboard && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Live Data Snapshot</h3>
              <p className="text-xs text-slate-500">The metrics below reflect the exact database records that will be bundled into your export files.</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Live DB Synced
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Active Goals</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{dashboard.kpis.total_active_goals}</div>
              <span className="text-[11px] text-slate-500">{dashboard.kpis.completed_goals} Completed &middot; {dashboard.kpis.goals_at_risk} At Risk</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Activities Due This Week</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{dashboard.kpis.activities_due_this_week}</div>
              <span className="text-[11px] text-emerald-600 font-medium">{dashboard.kpis.activities_completed_this_week} Completed this week</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Overdue Backlog</span>
              <div className="text-xl font-bold text-rose-600 mt-1">{dashboard.kpis.overdue_activities}</div>
              <span className="text-[11px] text-slate-500">{dashboard.kpis.pending_action_items} Governance Action Items</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Review Compliance</span>
              <div className="text-xl font-bold text-teal-600 mt-1">{dashboard.kpis.weekly_review_compliance}%</div>
              <span className="text-[11px] text-slate-500">Saturday Cadence</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
