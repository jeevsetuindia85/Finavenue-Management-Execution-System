import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { HiringPage } from './pages/HiringPage';
import { ExpansionPage } from './pages/ExpansionPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

// Admin & Employee Isolation Pages
import { EmployeeDashboardPage } from './pages/EmployeeDashboardPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { MySubmissionsPage } from './pages/MySubmissionsPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { AdminTeamPage } from './pages/AdminTeamPage';
import { AdminTasksPage } from './pages/AdminTasksPage';
import { AdminActivityLogsPage } from './pages/AdminActivityLogsPage';

import { api } from './services/api';
import { User } from './types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 break-words">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayout: React.FC<{
  currentUser: User | null;
  onUserSwitch: (user: User) => void;
  children: React.ReactNode;
}> = ({ currentUser, onUserSwitch, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar
        currentUser={currentUser}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen ${
          collapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Header currentUser={currentUser} onUserSwitch={onUserSwitch} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.warn('Authentication token invalid or expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide text-slate-300">Loading ExecFlow Platform...</div>
      </div>
    );
  }

  const role = currentUser?.role || 'team_member';
  const isEmployee = role === 'team_member' || role === 'employee';
  const isAdminOrMgmt = role === 'admin' || role === 'management';

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage onLoginSuccess={checkAuth} />
              )
            }
          />

          {/* Protected App Routes */}
          <Route
            path="/*"
            element={
              currentUser ? (
                <AppLayout
                  currentUser={currentUser}
                  onUserSwitch={(u) => setCurrentUser(u)}
                >
                  <Routes>
                    {/* Root / Dashboard */}
                    <Route
                      path="/"
                      element={
                        isEmployee ? (
                          <EmployeeDashboardPage />
                        ) : (
                          <DashboardPage />
                        )
                      }
                    />

                    {/* Employee Private Workspace Routes */}
                    <Route path="/my-tasks" element={<MyTasksPage />} />
                    <Route path="/my-submissions" element={<MySubmissionsPage />} />
                    <Route path="/my-profile" element={<MyProfilePage />} />

                    {/* Calendar available to all authenticated roles */}
                    <Route path="/calendar" element={<CalendarPage />} />

                    {/* Admin Specific Routes */}
                    <Route
                      path="/admin/team"
                      element={isAdminOrMgmt ? <AdminTeamPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/team"
                      element={isAdminOrMgmt ? <AdminTeamPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/admin/tasks"
                      element={isAdminOrMgmt ? <AdminTasksPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/admin/activity-logs"
                      element={isAdminOrMgmt ? <AdminActivityLogsPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/settings"
                      element={isAdminOrMgmt ? <SettingsPage /> : <Navigate to="/" replace />}
                    />

                    {/* Management & Goal Tracking Routes */}
                    <Route
                      path="/goals"
                      element={!isEmployee ? <GoalsPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/activities"
                      element={!isEmployee ? <ActivitiesPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/hiring"
                      element={!isEmployee ? <HiringPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/expansion"
                      element={!isEmployee ? <ExpansionPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/products"
                      element={!isEmployee ? <ProductsPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/reviews"
                      element={!isEmployee ? <ReviewsPage /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/reports"
                      element={!isEmployee ? <ReportsPage /> : <Navigate to="/" replace />}
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
