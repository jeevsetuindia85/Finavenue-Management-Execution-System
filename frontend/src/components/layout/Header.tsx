import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { User, Notification } from '../../types';
import { api } from '../../services/api';

interface HeaderProps {
  currentUser: User | null;
  onUserSwitch: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onUserSwitch }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const demoPersonas = [
    { email: 'admin@mes.local', role: 'admin', name: 'System Admin (FA-ADM-001)', title: 'Super Admin — Full Control' },
    { email: 'ceo@mes.local', role: 'management', name: 'Rajesh Mehta (FA-EXEC-001)', title: 'CEO / Executive Management' },
    { email: 'hr@mes.local', role: 'goal_owner', name: 'Priya Sharma (FA-HR-001)', title: 'Head of Talent (Goal 01)' },
    { email: 'analyst1@mes.local', role: 'team_member', name: 'Vikram Joshi (FA-EMP-001)', title: 'Financial Analyst (Employee)' },
    { email: 'recruiter@mes.local', role: 'team_member', name: 'Ananya Iyer (FA-EMP-002)', title: 'HR Recruiter (Employee)' },
    { email: 'bd@mes.local', role: 'goal_owner', name: 'Amit Patel (FA-BD-001)', title: 'Head of BD (Goal 02)' },
    { email: 'product@mes.local', role: 'goal_owner', name: 'Sneha Reddy (FA-PRD-001)', title: 'Head of Product (Goal 03)' },
  ];

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const countRes = await api.getNotificationCount();
      setUnreadCount(countRes.unread_count);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifs();
    }
  }, [currentUser]);

  const handleSwitchPersona = async (email: string) => {
    try {
      const password = email === 'admin@mes.local' ? 'admin123' : 'demo1234';
      await api.loginJson(email, password);
      const user = await api.getCurrentUser();
      onUserSwitch(user);
      setShowPersonaMenu(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncCalendar();
      await api.triggerAlertRules();
      await fetchNotifs();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/activities?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search goals, activities, candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </form>
      </div>

      {/* Center Reporting Period Pill */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
        <Clock size={13} className="text-teal-600" />
        <span>Cadence: <strong>Weekly Review</strong></span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-600">Saturday Primary / Tuesday Fallback</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync Button */}
        <button
          onClick={handleQuickSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          title="Sync Calendar & Evaluate Alert Rules"
        >
          <RefreshCw size={13} className={`${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Sync & Check</span>
        </button>

        {/* Calendar Shortcut */}
        <button
          onClick={() => navigate('/calendar')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition relative"
          title="View Management Calendar"
        >
          <CalendarIcon size={18} />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  <Bell size={15} className="text-teal-600" />
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition cursor-pointer ${
                        !notif.is_read ? 'bg-teal-50/40' : ''
                      }`}
                      onClick={async () => {
                        await api.markNotificationRead(notif.id);
                        fetchNotifs();
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type.includes('overdue') || notif.type.includes('missed') ? (
                          <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 size={14} className="text-teal-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{notif.title}</p>
                          <p className="text-slate-500 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logged in Employee Info Badge */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2 pl-3 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-semibold text-slate-800">{currentUser.full_name}</span>
            {currentUser.employee_id && (
              <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 font-mono text-[10px] font-bold border border-teal-500/20">
                {currentUser.employee_id}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium capitalize">
              {currentUser.role?.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-xs font-medium shadow-xs"
            title="Switch Demo Role Persona"
          >
            <Sparkles size={13} className="text-teal-400" />
            <span className="hidden sm:inline">Switch:</span>
            <span className="text-teal-300 font-semibold capitalize">
              {currentUser?.role === 'admin' ? 'Super Admin' : currentUser?.role?.replace('_', ' ') || 'Role'}
            </span>
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">Quick Persona Switcher</p>
                <p className="text-[11px] text-slate-400">Test platform views under different roles</p>
              </div>
              <div className="py-1">
                {demoPersonas.map((p) => (
                  <button
                    key={p.email}
                    onClick={() => handleSwitchPersona(p.email)}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition ${
                      currentUser?.email === p.email ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => api.logout()}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
