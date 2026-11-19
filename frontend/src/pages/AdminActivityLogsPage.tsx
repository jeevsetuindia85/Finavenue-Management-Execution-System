import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  KeyRound,
  LogIn,
  LogOut,
  Clock,
  User,
  Monitor,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem, LoginSession } from '../types';

export const AdminActivityLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'sessions'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [auditRes, sessionsRes] = await Promise.all([
        api.getAuditLogs({ limit: 150 }),
        api.getLoginSessions(100)
      ]);
      setAuditLogs(auditRes);
      setSessions(sessionsRes);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAudit = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      (log.employee_id && log.employee_id.toLowerCase().includes(q)) ||
      (log.new_value && log.new_value.toLowerCase().includes(q))
    );
  });

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.user_name && s.user_name.toLowerCase().includes(q)) ||
      (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
      (s.ip_address && s.ip_address.toLowerCase().includes(q)) ||
      (s.user_agent && s.user_agent.toLowerCase().includes(q)) ||
      s.status.toLowerCase().includes(q)
    );
  });

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
            <Activity className="w-7 h-7 text-teal-600" />
            Activity & Session Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail: logins, logouts, task allocations, deliverable submissions, reviews, and security events.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : ''} />
          Refresh Logs
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-fit">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Shield size={14} className="text-teal-600" />
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <LogIn size={14} className="text-indigo-600" />
            Login Sessions ({sessions.length})
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'audit' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Employee ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Payload</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{log.user_name || 'System / Automated'}</div>
                        {log.employee_id && (
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                            {log.employee_id}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          log.action.includes('submit')
                            ? 'bg-blue-100 text-blue-800'
                            : log.action.includes('approve')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action.includes('login')
                            ? 'bg-indigo-100 text-indigo-800'
                            : log.action.includes('create')
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 capitalize">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 max-w-sm truncate text-slate-600 font-mono text-[11px]">
                        {log.new_value || '-'}
                      </td>

                      {/* IP */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {log.ip_address || 'local'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sessions Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Browser / Device</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logout Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                      Loading login sessions...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No login sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {new Date(s.login_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{s.user_name || `User #${s.user_id}`}</div>
                        {s.employee_id && (
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                            {s.employee_id}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        {s.ip_address || 'unknown'}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Monitor size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{s.user_agent || 'Unknown'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {s.logout_at ? new Date(s.logout_at).toLocaleTimeString() : 'Still Active'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
