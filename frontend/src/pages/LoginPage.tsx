import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  BadgeCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.loginJson(identifier.trim(), password);
      await api.getCurrentUser();
      onLoginSuccess();
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Invalid Employee ID/Email or password. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
    setLoading(true);

    try {
      await api.loginJson(id, pass);
      await api.getCurrentUser();
      onLoginSuccess();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-500/10 via-slate-800/20 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand / Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-slate-800 text-white shadow-xl shadow-teal-500/10 mb-3 border border-teal-400/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">ExecFlow</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Finavenue Management Execution System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Admin-Controlled Multi-User Platform
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Employee ID, Username, or Corporate Email.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{error}</span>
                <p className="mt-1 text-slate-600 text-[11px]">
                  Tip: Use 1-Click Persona Login below or check your credentials with System Admin.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee ID / Email / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. FA-ADM-001, FA-EMP-001, or admin@mes.local"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                1-Click Instant Persona Login
              </span>
              <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                Pre-authenticated
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {/* Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@mes.local', 'admin123')}
                className="w-full p-2 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                    ADM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      System Admin
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-1 rounded">FA-ADM-001</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Super Admin &middot; Full System Control</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-700 group-hover:underline">Login &rarr;</span>
              </button>

              {/* CEO */}
              <button
                type="button"
                onClick={() => handleQuickLogin('ceo@mes.local', 'demo1234')}
                className="w-full p-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    CEO
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      Dr. Rajesh Mehta
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded">FA-EXEC-001</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Executive Management</div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-700">Login &rarr;</span>
              </button>

              {/* Employee 1: Financial Analyst */}
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst1@mes.local', 'demo1234')}
                className="w-full p-2 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                    EMP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      Vikram Joshi
                      <span className="text-[10px] font-mono text-teal-800 bg-teal-100 px-1 rounded">FA-EMP-001</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Team Member &middot; Financial Analyst (Isolated Workspace)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-700 group-hover:underline">Login &rarr;</span>
              </button>

              {/* Employee 2: Recruiter */}
              <button
                type="button"
                onClick={() => handleQuickLogin('recruiter@mes.local', 'demo1234')}
                className="w-full p-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    HR
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      Ananya Iyer
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 rounded">FA-EMP-002</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Team Member &middot; HR Recruiter</div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-700">Login &rarr;</span>
              </button>
            </div>
          </div>

          {/* Privacy & Policy notice */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              Public registration is disabled. All user accounts and employee IDs are managed centrally by the Administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-xs text-slate-500">
          ExecFlow &copy; 2026 &middot; Finavenue Capital Management Execution System
        </div>
      </div>
    </div>
  );
};
