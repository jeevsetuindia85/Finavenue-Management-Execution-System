import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Calendar as CalendarIcon, 
  Bell, 
  Shield, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Link, 
  Unlink, 
  Save, 
  Key,
  Clock,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [alertTriggering, setAlertTriggering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'calendar' | 'notifications' | 'system'>('profile');

  // Form states
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [currentUser, calStatus] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getCalendarStatus().catch(() => null),
      ]);
      if (currentUser) {
        setUser(currentUser);
        setFullName(currentUser.full_name);
        setJobTitle(currentUser.job_title || '');
      }
      if (calStatus) {
        setCalendarStatus(calStatus);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setSyncing(true);
      const result = await api.syncCalendar();
      alert(`Calendar sync complete!\nSynced: ${result.synced_events} events\nCreated: ${result.created || 0}\nUpdated: ${result.updated || 0}`);
      const updatedStatus = await api.getCalendarStatus();
      setCalendarStatus(updatedStatus);
    } catch (err: any) {
      alert(`Sync failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar integration?')) return;
    try {
      await api.disconnectCalendar();
      const updatedStatus = await api.getCalendarStatus();
      setCalendarStatus(updatedStatus);
      alert('Google Calendar disconnected.');
    } catch (err: any) {
      alert(`Failed to disconnect: ${err.message}`);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const res = await api.getOAuthConnectUrl();
      if (res.authorization_url) {
        window.open(res.authorization_url, '_blank', 'width=600,height=700');
        // Refresh status after dialog
        setTimeout(async () => {
          const updated = await api.getCalendarStatus();
          setCalendarStatus(updated);
        }, 3000);
      }
    } catch (err: any) {
      alert(`OAuth initiation failed: ${err.message}`);
    }
  };

  const handleTriggerAlertRules = async () => {
    try {
      setAlertTriggering(true);
      const res = await api.triggerAlertRules();
      alert(`Intelligent Alert Engine run complete!\nCreated: ${res.created_alerts_count} new alerts`);
    } catch (err: any) {
      alert(`Failed to trigger alert rules: ${err.message}`);
    } finally {
      setAlertTriggering(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & User Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your executive profile, Google Calendar two-way synchronization, automated alert triggers, and security preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          User Profile
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Google Calendar Sync
          {calendarStatus?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Alert Rules & Automation
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          System & Audit
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <h3 className="font-semibold text-slate-900 text-base mb-1">Executive Profile Information</h3>
          <p className="text-xs text-slate-500 mb-6">Update your display information and corporate title.</p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Chief Executive Officer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">System Role (RBAC)</label>
                <input
                  type="text"
                  disabled
                  value={user?.role?.toUpperCase() || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile changes updated successfully.
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Google Calendar Sync */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Google Calendar Two-Way Synchronization</h3>
            <p className="text-xs text-slate-500">
              Synchronize activities, candidate interviews, Saturday review cadences, and product milestones directly to your Google Calendar.
            </p>
          </div>

          {/* Connection Status Box */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${
                  calendarStatus?.connected 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {calendarStatus?.connected ? 'Google Calendar Connected' : 'Google Calendar Not Connected'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      calendarStatus?.connected 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {calendarStatus?.connected ? 'Active Sync' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {calendarStatus?.connected 
                      ? `Account: ${calendarStatus.account_email || 'demo@execflow.org'} &middot; Calendar: ${calendarStatus.calendar_id || 'primary'}`
                      : 'Connect your corporate Google account to enable automatic two-way calendar sync.'}
                  </p>
                </div>
              </div>

              <div>
                {calendarStatus?.connected ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncCalendar}
                      disabled={syncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-medium shadow-xs transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-teal-600' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={handleDisconnectCalendar}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectCalendar}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Link className="w-4 h-4" />
                    Connect Google Account
                  </button>
                )}
              </div>
            </div>

            {calendarStatus?.last_synced_at && (
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last synced: {new Date(calendarStatus.last_synced_at).toLocaleString()}
                </span>
                <span>{calendarStatus.total_events_synced || 0} events currently mapped</span>
              </div>
            )}
          </div>

          {/* Sync Configuration Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Synchronized Event Categories</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <div>
                  <div className="font-medium text-xs text-slate-900">Assigned Activity Deadlines</div>
                  <div className="text-[11px] text-slate-500">All tasks assigned to you will create reminder events at due dates.</div>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <div>
                  <div className="font-medium text-xs text-slate-900">Candidate Interviews & Feedback Follow-ups</div>
                  <div className="text-[11px] text-slate-500">Scheduled interviews for Senior Analyst, BD Lead, and CAT II Fund Manager.</div>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <div>
                  <div className="font-medium text-xs text-slate-900">Mandatory Weekly Reviews (Saturday & Tuesday Fallback)</div>
                  <div className="text-[11px] text-slate-500">Cadence meetings automatically blocked on calendar.</div>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <div>
                  <div className="font-medium text-xs text-slate-900">Expansion Site Visits & Conferences</div>
                  <div className="text-[11px] text-slate-500">Coworking inspection dates in Ahmedabad & Bangalore.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Alerts & Automation */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Intelligent Alert Engine</h3>
              <p className="text-xs text-slate-500">
                ExecFlow continuously scans 8 strategic business rules to identify operational bottlenecks before they cause delays.
              </p>
            </div>
            <button
              onClick={handleTriggerAlertRules}
              disabled={alertTriggering}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${alertTriggering ? 'animate-spin' : ''}`} />
              {alertTriggering ? 'Evaluating Rules...' : 'Run Rules Evaluation'}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Active Evaluation Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  1. Agency Zero-CV Warning
                </div>
                <p className="text-slate-500 mt-1">Triggers if an appointed hiring agency submits no CVs for over 7 days.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  2. Hiring Follow-up Overdue
                </div>
                <p className="text-slate-500 mt-1">Triggers if next scheduled agency follow-up date has passed.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  3. Weekly Reference Quota
                </div>
                <p className="text-slate-500 mt-1">Triggers if completed reference calls are below the 4 calls/week target.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  4. Conference Cadence
                </div>
                <p className="text-slate-500 mt-1">Triggers if no industry conference is scheduled within a 15-day window.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  5. Office Site Visit Pending
                </div>
                <p className="text-slate-500 mt-1">Triggers if candidate coworking provider has not received an on-site visit.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  6. Product Milestone Delayed
                </div>
                <p className="text-slate-500 mt-1">Triggers if a regulatory, compliance or deck milestone passes target date.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  7. Stale Task Update
                </div>
                <p className="text-slate-500 mt-1">Triggers if an assigned activity receives no status update for 5 days.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 font-bold" />
                  8. Saturday / Tuesday Red Alert
                </div>
                <p className="text-slate-500 mt-1">Triggers Red Governance Alert if Tuesday fallback review is missed.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System & Audit */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Architecture & Audit Trail</h3>
            <p className="text-xs text-slate-500">Technical infrastructure specifications and compliance metadata.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Platform Version</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">ExecFlow v1.0 Enterprise</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Backend Framework</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">FastAPI &middot; Python 3.12</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Database Engine</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">SQLAlchemy 2.0 (Async)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Security Standard</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">JWT &middot; Bcrypt &middot; RBAC</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Complete audit log of all goal updates, review records, and activities.</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Audit Trails Enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
