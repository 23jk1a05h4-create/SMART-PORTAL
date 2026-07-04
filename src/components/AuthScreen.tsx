import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, BookOpen, Shield, GraduationCap, Sparkles, CheckCircle, Flame } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, name, education, skills: skills.split(',').map(s => s.trim()).filter(Boolean) };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess(isLogin ? 'Login successful!' : 'Registration successful! Directing to dashboard...');
      
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoEmail.startsWith('admin') ? 'admin123' : 'student123' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess('Quick Login successful!');
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 600);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-indigo-100">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Visual Brand Section */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 md:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-indigo-200" />
              </div>
              <span className="font-display font-bold text-xl tracking-wide">EXAMPRO</span>
            </div>
            
            <div className="space-y-4 pt-4">
              <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight">
                Next-Gen Online Examinations
              </h1>
              <p className="text-indigo-100/90 text-sm leading-relaxed">
                Empowered with advanced anti-cheating protocols, secure JWT auth, real-time proctored checks, and custom AI learning paths.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-white/10 text-xs text-indigo-100/80">
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
              <span>Full-screen monitoring, copy-paste block, and keyboard shortcut interceptors.</span>
            </div>
            <div className="flex items-start space-x-3">
              <GraduationCap className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
              <span>Diagnostic skill feedback powered by Gemini 3.5 AI recommendations.</span>
            </div>
          </div>
        </div>

        {/* Credentials Form Section */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-slate-900">
                {isLogin ? 'Sign in to Portal' : 'Create Student Account'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isLogin 
                  ? 'Access your exams, practice histories, and skill profiles.' 
                  : 'Register now to participate in scheduled classes and practice tests.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ada Lovelace"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@exam.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => alert('Demo password: student123 or admin123. Use the quick buttons below!')}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">College/Degree</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford Computer Sci"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Skills (Comma sep)</label>
                      <input
                        type="text"
                        placeholder="e.g. Java, SQL, Python"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-indigo-100 disabled:opacity-50 mt-2"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                Or Quick Login Demo Roles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@exam.com')}
                disabled={loading}
                className="flex items-center justify-center space-x-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition"
              >
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                <span>Student: Ada Lovelace</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@exam.com')}
                disabled={loading}
                className="flex items-center justify-center space-x-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition"
              >
                <Shield className="h-4 w-4 text-amber-500" />
                <span>Admin: Prof. Turing</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-500 hover:text-indigo-600 transition font-medium"
              >
                {isLogin ? "Don't have an account? Sign up here" : 'Already have an account? Sign in here'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
