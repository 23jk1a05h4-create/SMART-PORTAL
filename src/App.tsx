import React, { useState, useEffect } from 'react';
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
      }
    }
    setSessionRestoring(false);
  }, []);

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
    localStorage.removeItem('exam_portal_token');
    localStorage.removeItem('exam_portal_user');
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('exam_portal_user', JSON.stringify(updatedUser));
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('exam_portal_theme', newTheme);
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
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
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
        />
      </div>
    );
  }

  // Role Routing
  if (user.role === 'admin') {
    return (
      <div className={`theme-${theme} theme-transition min-h-screen bg-slate-50`}>
        <AdminDashboard 
          token={token} 
          user={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
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
      />
    </div>
  );
}
