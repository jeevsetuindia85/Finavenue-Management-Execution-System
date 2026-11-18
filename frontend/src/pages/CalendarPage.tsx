import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Tag,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { api } from '../services/api';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const [eventsData, statusData] = await Promise.all([
        api.getCalendarEvents(),
        api.getCalendarStatus(),
      ]);
      setEvents(eventsData);
      setStatus(statusData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncCalendar();
      setSyncFeedback(res.message);
      await fetchCalendar();
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await api.getOAuthConnectUrl();
      if (res.is_demo_mode) {
        // Trigger demo OAuth flow directly
        window.location.href = res.oauth_url;
      } else {
        window.open(res.oauth_url, '_blank');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectCalendar();
      await fetchCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'all' && ev.entity_type !== filterType) return false;
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
            Execution Calendar & Google Sync
          </h1>
          <p className="text-sm text-slate-500">
            Unified scheduling for weekly reviews, activity due dates, interviews, and site visits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin text-teal-400' : ''} />
            {syncing ? 'Synchronizing...' : 'Sync Calendar Events'}
          </button>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          {syncFeedback}
        </div>
      )}

      {/* Google Calendar Connection Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Google Calendar OAuth Integration</h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  status?.is_connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {status?.is_connected ? 'Connected & Active' : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {status?.is_connected
                ? `Synchronized with ${status.calendar_id || 'primary'} calendar. Last sync: ${status.last_sync_at ? new Date(status.last_sync_at).toLocaleTimeString() : 'Just now'}.`
                : 'Connect your corporate Google account to sync review cadences, milestones, and interview panels.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.is_connected ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition"
            >
              <ExternalLink size={13} />
              Connect Google Account
            </button>
          )}
        </div>
      </div>

      {/* Calendar Controls & Events List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
            {[
              { id: 'all', label: 'All Scheduled Items' },
              { id: 'review', label: 'Weekly Reviews' },
              { id: 'activity', label: 'Activities' },
              { id: 'conference', label: 'Conferences' },
              { id: 'site_visit', label: 'Site Visits' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  filterType === t.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 tabular-nums">
            Showing {filteredEvents.length} synchronized items
          </span>
        </div>

        {/* Schedule Stream */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No calendar events found for this filter.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const d = new Date(ev.start_time);
              const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              let typeColor = 'bg-slate-100 text-slate-700';
              if (ev.entity_type === 'review') typeColor = 'bg-teal-50 text-teal-700 border border-teal-200';
              if (ev.entity_type === 'conference') typeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
              if (ev.entity_type === 'site_visit') typeColor = 'bg-sky-50 text-sky-700 border border-sky-200';

              return (
                <div key={ev.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-20 shrink-0 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-900 block text-xs">{dateStr}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{timeStr}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColor}`}>
                          {ev.entity_type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                      </div>
                      {ev.description && <p className="text-xs text-slate-500 mt-1">{ev.description}</p>}
                      {ev.location && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={11} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check size={11} /> Synced
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
