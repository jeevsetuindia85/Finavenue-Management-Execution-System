import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { TeamPage } from './pages/TeamPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './services/api';
import { User } from './types';

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
        <div className="text-sm font-semibold tracking-wide text-slate-300">Loading ExecFlow...</div>
      </div>
    );
  }

  return (
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
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/activities" element={<ActivitiesPage />} />
                  <Route path="/hiring" element={<HiringPage />} />
                  <Route path="/expansion" element={<ExpansionPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
  );
};

export default App;
