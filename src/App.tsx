import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Lock } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ExamScreen from './components/ExamScreen';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [sessionRestoring, setSessionRestoring] = useState(true);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('exam_portal_theme') || 'light');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Secondary Admin Passcode states
  const [adminVerified, setAdminVerified] = useState<boolean>(() => {
    return localStorage.getItem('exam_portal_admin_verified') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminVerifyError, setAdminVerifyError] = useState('');

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Restore authenticated sessions from localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('exam_portal_token');
    const savedUser = localStorage.getItem('exam_portal_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Session restoration failed:', e);
        localStorage.removeItem('exam_portal_token');
        localStorage.removeItem('exam_portal_user');
        localStorage.removeItem('exam_portal_admin_verified');
      }
    }
    setSessionRestoring(false);
  }, []);

  // Sync admin verification when user status resets
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setAdminVerified(false);
      localStorage.removeItem('exam_portal_admin_verified');
    }
  }, [user]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('exam_portal_token', newToken);
    localStorage.setItem('exam_portal_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveExamId(null);
    setAdminVerified(false);
    setAdminUsername('');
    setAdminPassword('');
    setAdminVerifyError('');
    localStorage.removeItem('exam_portal_token');
    localStorage.removeItem('exam_portal_user');
    localStorage.removeItem('exam_portal_admin_verified');
  };

  const handleAdminVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'adminpro' && adminPassword === 'adminpro123') {
      setAdminVerified(true);
      localStorage.setItem('exam_portal_admin_verified', 'true');
      triggerToast('Admin access granted successfully!', 'success');
      setAdminVerifyError('');
    } else {
      setAdminVerifyError('Incorrect Administrative Username or Passcode.');
      triggerToast('Access Denied!', 'error');
    }
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('exam_portal_user', JSON.stringify(updatedUser));
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('exam_portal_theme', newTheme);
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div 
        className="fixed top-4 right-4 z-50 animate-fade-in flex items-center space-x-3 p-4 rounded-xl border shadow-xl max-w-sm"
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderColor: 'var(--border-main, #e2e8f0)',
          color: 'var(--text-main, #0f172a)',
        }}
      >
        {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
        {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />}
        {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-500 shrink-0" />}
        <p className="text-xs font-semibold leading-normal flex-1">{toast.message}</p>
        <button 
          onClick={() => setToast(null)} 
          className="hover:opacity-80 transition shrink-0 p-0.5 rounded-md"
          style={{ color: 'var(--text-muted, #64748b)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (sessionRestoring) {
    return (
      <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50 flex items-center justify-center p-4`}>
        <div className="animate-pulse text-xs font-mono text-slate-400">RESTORING SESSION...</div>
      </div>
    );
  }

  // Auth Guard
  if (!token || !user) {
    return (
      <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50`}>
        <AuthScreen onLoginSuccess={handleLoginSuccess} onShowToast={triggerToast} />
        {renderToast()}
      </div>
    );
  }

  // Active Exam Guard (Student role only)
  if (user.role === 'student' && activeExamId) {
    return (
      <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50`}>
        <ExamScreen 
          token={token} 
          examId={activeExamId} 
          onFinish={() => setActiveExamId(null)} 
          theme={theme}
          onShowToast={triggerToast}
        />
        {renderToast()}
      </div>
    );
  }

  // Role Routing
  if (user.role === 'admin') {
    if (!adminVerified) {
      return (
        <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50 flex items-center justify-center p-4`}>
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900">Elevated Admin Access</h2>
              <p className="text-xs text-slate-500">This workspace requires a secondary administrative passcode confirmation.</p>
            </div>

            {adminVerifyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2 text-red-700 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{adminVerifyError}</span>
              </div>
            )}

            <form onSubmit={handleAdminVerifySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminpro"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                <span>Verify & Proceed</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Logged in as {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 font-bold transition"
              >
                Logout Account
              </button>
            </div>
          </div>
          {renderToast()}
        </div>
      );
    }

    return (
      <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50`}>
        <AdminDashboard 
          token={token} 
          user={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser}
          theme={theme}
          onThemeChange={handleThemeChange}
          onShowToast={triggerToast}
        />
        {renderToast()}
      </div>
    );
  }

  // Default Student Workspace
  return (
    <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50`}>
      <StudentDashboard 
        token={token} 
        user={user} 
        onLogout={handleLogout} 
        onStartExam={(id) => setActiveExamId(id)}
        onUpdateUser={handleUpdateUser}
        theme={theme}
        onThemeChange={handleThemeChange}
        onShowToast={triggerToast}
      />
      {renderToast()}
    </div>
  );
}
