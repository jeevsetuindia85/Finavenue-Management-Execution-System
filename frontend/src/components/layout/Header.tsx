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
  ChevronRight
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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleNotificationClick = async (notif: Notification) => {
    // 1. Mark as read in backend
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        fetchNotifs();
      }
    } catch (e) {
      // ignore
    }

    // 2. Close dropdown popover
    setShowNotifications(false);

    // 3. User role & context
    const isEmployee = currentUser?.role === 'team_member';
    const type = (notif.type || '').toLowerCase();
    const entityType = (notif.related_entity_type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const message = (notif.message || '').toLowerCase();

    // 4. Intelligent contextual routing:
    // Work submitted for review -> Admin Central Tasks (filtered to under_review)
    if (
      type.includes('task_submitted') ||
      title.includes('submitted for review') ||
      message.includes('submitted work for review')
    ) {
      if (isEmployee) {
        navigate('/my-submissions');
      } else {
        navigate('/admin/tasks?status=under_review');
      }
      return;
    }

    // Task assignment / task update / overdue
    if (entityType === 'activity' || type.includes('task') || type.includes('overdue')) {
      if (isEmployee) {
        navigate('/my-tasks');
      } else {
        navigate('/admin/tasks');
      }
      return;
    }

    // Hiring / Agency follow-up
    if (
      entityType === 'hiring_agency' ||
      type.includes('agency') ||
      title.includes('agency') ||
      message.includes('agency') ||
      title.includes('candidate') ||
      title.includes('hiring')
    ) {
      if (!isEmployee) {
        navigate('/hiring');
      } else {
        navigate('/my-tasks');
      }
      return;
    }

    // Expansion / Office / Site visit
    if (
      entityType === 'office_location' ||
      type.includes('expansion') ||
      type.includes('site_visit') ||
      title.includes('site visit') ||
      title.includes('expansion') ||
      title.includes('office')
    ) {
      if (!isEmployee) {
        navigate('/expansion');
      } else {
        navigate('/my-tasks');
      }
      return;
    }

    // Product initiatives
    if (
      entityType === 'product' ||
      type.includes('product') ||
      title.includes('product') ||
      title.includes('pms') ||
      title.includes('aif')
    ) {
      if (!isEmployee) {
        navigate('/products');
      } else {
        navigate('/my-tasks');
      }
      return;
    }

    // Weekly reviews
    if (
      entityType === 'review' ||
      type.includes('review') ||
      title.includes('review') ||
      message.includes('review')
    ) {
      if (!isEmployee) {
        navigate('/reviews');
      } else {
        navigate('/my-tasks');
      }
      return;
    }

    // Calendar
    if (entityType === 'calendar' || type.includes('calendar') || title.includes('calendar')) {
      navigate('/calendar');
      return;
    }

    // User / Team management
    if (
      entityType === 'user' ||
      type.includes('user') ||
      title.includes('employee') ||
      title.includes('account')
    ) {
      if (!isEmployee) {
        navigate('/admin/team');
      } else {
        navigate('/my-profile');
      }
      return;
    }

    // Fallback based on role
    if (isEmployee) {
      navigate('/my-tasks');
    } else {
      navigate('/admin/tasks');
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
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
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
                    notifications.map((notif) => {
                      const isEmployee = currentUser?.role === 'team_member';
                      const type = (notif.type || '').toLowerCase();
                      const title = (notif.title || '').toLowerCase();
                      const entityType = (notif.related_entity_type || '').toLowerCase();
                      
                      let targetLabel = isEmployee ? 'My Tasks' : 'Central Tasks';
                      if (type.includes('task_submitted') || title.includes('submitted for review')) {
                        targetLabel = isEmployee ? 'My Submissions' : 'Review Work';
                      } else if (entityType === 'hiring_agency' || title.includes('agency') || title.includes('hiring')) {
                        targetLabel = 'Hiring';
                      } else if (entityType === 'office_location' || title.includes('site visit') || title.includes('expansion')) {
                        targetLabel = 'Expansion';
                      } else if (entityType === 'product' || title.includes('product')) {
                        targetLabel = 'Products';
                      } else if (entityType === 'review' || title.includes('review')) {
                        targetLabel = 'Reviews';
                      }

                      return (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs hover:bg-slate-50/90 active:bg-slate-100 transition cursor-pointer group ${
                            !notif.is_read ? 'bg-teal-50/40' : ''
                          }`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-start gap-2.5">
                            {notif.type.includes('overdue') || notif.type.includes('missed') ? (
                              <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 size={15} className="text-teal-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold text-slate-800 truncate">{notif.title}</p>
                                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 opacity-80 group-hover:opacity-100 transition flex items-center shrink-0">
                                  {targetLabel} <ChevronRight size={10} className="ml-0.5" />
                                </span>
                              </div>
                              <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100/60 text-[10px]">
                                <span className="text-slate-400">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                  Go to details &rarr;
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
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
