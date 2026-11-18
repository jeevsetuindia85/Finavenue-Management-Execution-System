import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.loginJson(email, password);
      await api.getCurrentUser();
      onLoginSuccess();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      await api.loginJson(demoEmail, demoPass);
      await api.getCurrentUser();
      onLoginSuccess();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to authenticate with demo credentials.');
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-slate-800 text-white shadow-xl shadow-teal-500/10 mb-4 border border-teal-400/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">ExecFlow</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Management Execution & Goal Tracking SaaS</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Enterprise Edition &middot; 2026 Ready
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter credentials or click any demo persona below.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{error}</span>
                <p className="mt-1 text-slate-600 text-[11px]">
                  Tip: Use 1-Click Demo Login below or password <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold text-rose-900">demo1234</code>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hr@mes.local or ceo@mes.local"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. demo1234"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <KeyRound className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Demo password: <strong className="text-slate-800 font-mono">demo1234</strong> (or click instant access below)</span>
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
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1-Click Instant Login</span>
              <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">No password needed</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ceo@mes.local', 'demo1234')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    CEO
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Dr. Rajesh Mehta</div>
                    <div className="text-[10px] text-slate-500">ceo@mes.local &middot; Management / Executive</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hr@mes.local', 'demo1234')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    HR
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Priya Sharma</div>
                    <div className="text-[10px] text-slate-500">hr@mes.local &middot; Goal 01: Talent Acquisition</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bd@mes.local', 'demo1234')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    EXP
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Amit Patel</div>
                    <div className="text-[10px] text-slate-500">bd@mes.local &middot; Goal 02: Ahmedabad & Bangalore</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('product@mes.local', 'demo1234')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    PRD
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Sneha Reddy</div>
                    <div className="text-[10px] text-slate-500">product@mes.local &middot; Goal 03: PMS & CAT II AIF</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('maitwayi@mes.local', 'demo1234')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ANA
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Maitwayi Desai</div>
                    <div className="text-[10px] text-slate-500">maitwayi@mes.local &middot; Execution Coordinator</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Enter &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          ExecFlow &copy; 2026 &middot; Annual Business Execution & Governance
        </div>
      </div>
    </div>
  );
};
