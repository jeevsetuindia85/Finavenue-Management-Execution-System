import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  UserPlus,
  Building2,
  Layers,
  CalendarCheck2,
  Calendar,
  Users,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentUser: User | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { name: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Goals & Objectives', path: '/goals', icon: Target },
    { name: 'Activity Tracker', path: '/activities', icon: CheckSquare },
    { name: 'Hiring Management', path: '/hiring', icon: UserPlus },
    { name: 'Office Expansion', path: '/expansion', icon: Building2 },
    { name: 'Product Development', path: '/products', icon: Layers },
    { name: 'Weekly Reviews', path: '/reviews', icon: CalendarCheck2 },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Team Management', path: '/team', icon: Users },
    { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-4 bg-teal-400 rounded-sm"></span>
              <span className="w-1.5 h-2.5 bg-teal-500 rounded-sm"></span>
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                ExecFlow
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold uppercase">
                  OS
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Management Execution</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User / Cadence Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-semibold text-xs shrink-0">
              {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">
                {currentUser?.full_name || 'Guest User'}
              </span>
              <span className="text-[11px] text-slate-400 capitalize truncate flex items-center gap-1">
                <ShieldCheck size={12} className="text-teal-400 inline" />
                {currentUser?.role?.replace('_', ' ') || 'Management'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${currentUser?.full_name} (${currentUser?.role})`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-semibold text-xs">
              {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
