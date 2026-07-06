import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, BookOpen, Trophy, Award, MessageSquare, User as UserIcon, 
  Flame, Bell, LogOut, CheckCircle, AlertTriangle, Play, HelpCircle, 
  Bookmark, ChevronRight, Send, Search, Filter, ShieldAlert, Clock, RefreshCw, Eye, BookOpenCheck, Sparkles,
  Palette, Sun, Moon, Coffee, Leaf
} from 'lucide-react';
import { Exam, Question, Certificate, Notification, DiscussionMessage } from '../types';

interface StudentDashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
  onStartExam: (examId: string) => void;
  onUpdateUser?: (updatedUser: any) => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function StudentDashboard({ token, user, onLogout, onStartExam, onUpdateUser, theme = 'light', onThemeChange, onShowToast }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'practice' | 'leaderboard' | 'discussions' | 'profile'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [bookmarks, setBookmarks] = useState<Question[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  
  // Practice Mode States
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceDifficulty, setPracticeDifficulty] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [currentPracticeIdx, setCurrentPracticeIdx] = useState(0);
  const [selectedPracticeAns, setSelectedPracticeAns] = useState<any>(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [practiceResult, setPracticeResult] = useState<any>(null);

  // Discussion States
  const [discussionTopic, setDiscussionTopic] = useState('General');
  const [discussions, setDiscussions] = useState<DiscussionMessage[]>([]);
  const [newPost, setNewPost] = useState('');

  // Profile Edit States
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileEducation, setProfileEducation] = useState(user.education || '');
  const [profileSkills, setProfileSkills] = useState(user.skills?.join(', ') || '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatar || '');
  const [resumeFileUploaded, setResumeFileUploaded] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardTime, setLeaderboardTime] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Certificate Modal State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Load basic dashboard stats
  const fetchStatsAndConfigs = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Stats
      const statsRes = await fetch('/api/student/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.ok ? await statsRes.json() : null;
        setStats(statsData);
      }

      // Exams
      const examsRes = await fetch('/api/exams', { headers });
      if (examsRes.ok) setExams(await examsRes.json());

      // Bookmarks
      const bookRes = await fetch('/api/bookmarks/list', { headers });
      if (bookRes.ok) setBookmarks(await bookRes.json());

      // Certificates
      const certRes = await fetch('/api/certificates', { headers });
      if (certRes.ok) setCertificates(await certRes.json());

      // Notifications
      const notifRes = await fetch('/api/notifications', { headers });
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        setNotifications(notifs);
        setUnreadNotifCount(notifs.filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error('Error fetching student dashboard info:', e);
    }
  };

  useEffect(() => {
    fetchStatsAndConfigs();
  }, [activeTab]);

  // Handle marking notifications as read
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  // Load practice questions
  const loadPracticeQuestions = async () => {
    try {
      let url = '/api/practice/questions';
      const params = [];
      if (practiceTopic) params.push(`topic=${practiceTopic}`);
      if (practiceDifficulty) params.push(`difficulty=${practiceDifficulty}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const qList = await res.json();
        setPracticeQuestions(qList);
        setCurrentPracticeIdx(0);
        setSelectedPracticeAns(null);
        setPracticeSubmitted(false);
        setPracticeResult(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'practice') {
      loadPracticeQuestions();
    }
  }, [practiceTopic, practiceDifficulty, activeTab]);

  // Submit single practice question
  const handlePracticeSubmit = async () => {
    if (selectedPracticeAns === null) return;
    try {
      const q = practiceQuestions[currentPracticeIdx];
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: q.id,
          userAnswer: selectedPracticeAns
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPracticeResult(data);
        setPracticeSubmitted(true);
        // Refresh Stats silently
        fetchStatsAndConfigs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle bookmark in practice
  const handleToggleBookmark = async (qId: string, exId: string) => {
    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questionId: qId, examId: exId })
      });
      if (res.ok) {
        // Refresh local bookmark state
        const bookRes = await fetch('/api/bookmarks/list', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (bookRes.ok) setBookmarks(await bookRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load Leaderboard
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const loadLeaderboard = async () => {
        try {
          const res = await fetch('/api/leaderboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLeaderboard(data[leaderboardTime] || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadLeaderboard();
    }
  }, [activeTab, leaderboardTime]);

  // Load Discussions
  const loadDiscussions = async () => {
    try {
      const res = await fetch(`/api/discussions?topic=${discussionTopic}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDiscussions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'discussions') {
      loadDiscussions();
    }
  }, [activeTab, discussionTopic]);

  // Post Discussion message
  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newPost, topic: discussionTopic })
      });
      if (res.ok) {
        setNewPost('');
        loadDiscussions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save profile edits
  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          education: profileEducation,
          skills: profileSkills.split(',').map(s => s.trim()).filter(Boolean),
          avatar: profileAvatar
        })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setEditingProfile(false);
        onShowToast?.('Profile saved successfully!', 'success');
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        fetchStatsAndConfigs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      
      {/* Upper Navigation Rail */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-slate-800">ExamPro Student</span>
        </div>

        <div className="flex items-center space-x-6">
          
          {/* Notifications dropdown simulation */}
          <div className="relative group">
            <button 
              onClick={handleMarkNotificationsRead}
              className="p-2 text-slate-500 hover:text-indigo-600 transition rounded-full hover:bg-slate-50 relative"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            
            {/* Popover notifications */}
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-xl p-4 hidden group-hover:block transition animate-fade-in">
              <h4 className="font-display font-bold text-xs text-slate-800 tracking-wider uppercase border-b border-slate-50 pb-2 mb-2">
                Recent Alerts
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No alerts recorded.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-2.5 rounded-lg text-xs transition ${n.read ? 'bg-slate-50' : 'bg-indigo-50/50'}`}>
                      <div className="font-bold text-slate-800">{n.title}</div>
                      <div className="text-slate-500 mt-1">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Theme Switcher Popover */}
          {onThemeChange && (
            <div className="relative group mr-1">
              <button 
                className="p-2 text-slate-500 hover:text-indigo-600 transition rounded-full hover:bg-slate-50 flex items-center justify-center focus:outline-none"
                title="Change Workspace Theme"
              >
                <Palette className="h-5 w-5" />
              </button>
              
              {/* Dropdown Options */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-2 hidden group-hover:block transition animate-fade-in z-50">
                <h4 className="font-display font-bold text-[10px] text-slate-400 tracking-wider uppercase px-3 py-1.5">
                  Select Theme
                </h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => onThemeChange('light')}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition ${theme === 'light' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>☀️ Light Mode</span>
                  </button>
                  <button
                    onClick={() => onThemeChange('dark')}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition ${theme === 'dark' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span>🌙 Midnight Slate</span>
                  </button>
                  <button
                    onClick={() => onThemeChange('sepia')}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition ${theme === 'sepia' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Coffee className="h-4 w-4 text-amber-700" />
                    <span>☕ Cozy Sepia</span>
                  </button>
                  <button
                    onClick={() => onThemeChange('forest')}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition ${theme === 'forest' ? 'bg-emerald-950 text-emerald-200 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    <span>🌲 Forest Emerald</span>
                  </button>
                  <button
                    onClick={() => onThemeChange('cyber')}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition ${theme === 'cyber' ? 'bg-pink-950 text-pink-200 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Sparkles className="h-4 w-4 text-pink-500 animate-pulse" />
                    <span>⚡ Cyber Neon</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 pl-4 border-l border-slate-100">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{profileName || user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role} workspace</div>
            </div>
            <img 
              src={profileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
              alt="Avatar" 
              className="h-9 w-9 rounded-full object-cover border border-indigo-100"
            />
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side Sidebar Controls */}
        <aside className="md:col-span-3 space-y-2">
          <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Skill Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'exams' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-4 w-4" />
                <span>Active Mock Exams</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold group-hover:bg-white">
                {exams.filter(e => e.published).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('practice')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'practice' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpenCheck className="h-4 w-4" />
              <span>Test Yourself</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Trophy className="h-4 w-4" />
              <span>Global Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('discussions')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'discussions' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Discussion board</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Award className="h-4 w-4" />
              <span>Profile & Certificates</span>
            </button>
          </div>

          {/* Quick Stats Sidebar Widget */}
          {stats && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10">
                <Trophy className="h-32 w-32 translate-x-4 translate-y-4" />
              </div>
              
              <div className="flex items-center space-x-2 bg-white/10 px-2.5 py-1 rounded-full text-[11px] w-fit font-bold mb-4">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>STREAK: {stats.streak} DAYS</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-slate-400 text-xs">Leaderboard Rank</div>
                  <div className="text-2xl font-display font-bold">#{stats.rank}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Mock Exams Completed</div>
                  <div className="text-2xl font-display font-bold">{stats.completedExams}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Skill Accuracy</div>
                  <div className="text-2xl font-display font-bold text-emerald-400">{stats.averageScore}%</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Side Working Canvas */}
        <main className="md:col-span-9 space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Stats Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mock Exams Taken</div>
                  <div className="text-2xl font-display font-bold text-slate-800 mt-1">
                    {stats?.completedExams || 0} <span className="text-slate-300 text-sm">/ {stats?.totalExams || 0}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Average Accuracy</div>
                  <div className="text-2xl font-display font-bold text-indigo-600 mt-1">{stats?.averageScore || 0}%</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Certifications</div>
                  <div className="text-2xl font-display font-bold text-amber-500 mt-1">{stats?.certificatesCount || 0}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Practice Streak</div>
                  <div className="text-2xl font-display font-bold text-emerald-600 mt-1 flex items-center space-x-1">
                    <Flame className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>{stats?.streak || 0} Days</span>
                  </div>
                </div>
              </div>

              {/* Vector Diagnostic Charts (Accuracy, Practice and Speed) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Accuracy & Progress SVG Chart */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-sm text-slate-800">Domain Accuracy Performance</h3>
                    <span className="text-xs text-slate-400">Past 5 Evaluations</span>
                  </div>
                  
                  {/* SVG Line / Area Graph */}
                  <div className="h-44 w-full">
                    <svg viewBox="0 0 500 150" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="120" x2="480" y2="120" stroke="#e2e8f0" strokeWidth="1" />
                      
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Area Area */}
                      <path d="M 40 120 L 130 90 L 220 100 L 310 60 L 400 40 L 480 30 L 480 120 Z" fill="url(#areaGrad)" />
                      
                      {/* Trend Line */}
                      <path d="M 40 120 L 130 90 L 220 100 L 310 60 L 400 40 L 480 30" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Data Dots */}
                      <circle cx="130" cy="90" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="220" cy="100" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="310" cy="60" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="400" cy="40" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="480" cy="30" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      
                      {/* Labels */}
                      <text x="35" y="125" textAnchor="end" className="text-[10px] font-mono fill-slate-400">0%</text>
                      <text x="35" y="75" textAnchor="end" className="text-[10px] font-mono fill-slate-400">50%</text>
                      <text x="35" y="25" textAnchor="end" className="text-[10px] font-mono fill-slate-400">100%</text>
                      
                      <text x="130" y="140" textAnchor="middle" className="text-[9px] font-medium fill-slate-400">Java I</text>
                      <text x="220" y="140" textAnchor="middle" className="text-[9px] font-medium fill-slate-400">SQL I</text>
                      <text x="310" y="140" textAnchor="middle" className="text-[9px] font-medium fill-slate-400">Java II</text>
                      <text x="400" y="140" textAnchor="middle" className="text-[9px] font-medium fill-slate-400">SQL II</text>
                      <text x="480" y="140" textAnchor="middle" className="text-[9px] font-medium fill-slate-400">Web Basics</text>
                    </svg>
                  </div>
                </div>

                {/* Topics Weak vs Strong SVG Radar Representation */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <h3 className="font-display font-bold text-sm text-slate-800">Domain Performance Analysis</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50/50 border border-red-50 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Gaps / Weak Subtopics</div>
                      {stats?.weakTopics && stats.weakTopics.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {stats.weakTopics.map((t: string) => (
                            <div key={t} className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 pt-1">No weak areas identified. Good core standards!</p>
                      )}
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-50 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Proficient Topics</div>
                      {stats?.strongTopics && stats.strongTopics.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {stats.strongTopics.map((t: string) => (
                            <div key={t} className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 pt-1">Take mock tests to establish skill ratings.</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-3 flex items-center space-x-3 text-xs text-slate-500">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Recommendations updated automatically following every mock exam completion.</span>
                  </div>
                </div>

              </div>

              {/* Topic Recommendations Widget */}
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-slate-800">Learning Diagnostics & Skill Improvement</h3>
                    <p className="text-xs text-slate-400">Personalized learning suggestions from AI diagnostic checks</p>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                    System Calibrated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rule-based list of suggestions based on score */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topic Recommendations</h4>
                    <div className="space-y-3">
                      {stats?.weakTopics?.includes('OOP') || stats?.weakTopics?.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-800">Java: OOP, Collections & Basics</div>
                            <div className="text-[11px] text-slate-500">Recommend study: sealed classes, lists performance, exception flows.</div>
                          </div>
                        </div>
                      ) : null}

                      {stats?.weakTopics?.includes('Queries') || stats?.weakTopics?.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-800">SQL: Normalizations, Joins & Indexes</div>
                            <div className="text-[11px] text-slate-500">Focus on database primary keys optimization and nested query joins.</div>
                          </div>
                        </div>
                      ) : null}

                      {/* Fallback general tip if they are doing great */}
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-50/80 flex items-start space-x-3">
                        <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-indigo-900">Advance Level Practice Recommendation</div>
                          <div className="text-[11px] text-indigo-700">Participate in scheduled mock exams and practice hard-level coding templates.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Curated Study Assets */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curated Study Resources</h4>
                    <div className="space-y-3">
                      <a 
                        href="https://www.youtube.com/results?search_query=java+programming+tutorial" 
                        target="_blank" 
                        rel="noreferrer"
                        className="block p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Complete Java Crash Course [VIDEO]</div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Excellent YouTube tutorials explaining inheritance patterns and collections structures.</p>
                      </a>

                      <a 
                        href="https://use-the-index-luke.com/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="block p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Database Indexing & Query Optimizations [PDF/DOC]</div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Detailed guide on optimizing relational indexes, join speeds, and execution pipelines.</p>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Board */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800">Recent Portal Activities</h3>
                <div className="space-y-3">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((act: any) => (
                      <div key={act.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition border border-slate-50">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-800">{act.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-sm font-semibold">{act.type}</span>
                            <span>{act.meta}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(act.time).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No completed mock tests recorded. Try attempting an exam below!</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ACTIVE EXAMS LIST TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="font-display font-bold text-xl text-slate-900">Active scheduled Mock Examinations</h2>
                <p className="text-xs text-slate-500">Secure proctored testing. Fullscreen monitoring and webcam verification are enforced during attempts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.length === 0 ? (
                  <p className="text-sm text-slate-400">No scheduled exams currently available.</p>
                ) : (
                  exams.map(e => (
                    <div key={e.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-100 transition">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            e.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                            e.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {e.difficulty}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{e.duration} mins</span>
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-slate-800 text-sm leading-snug">{e.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{e.description}</p>
                      </div>

                      <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Negative Marking</div>
                          <div className="font-medium text-slate-700">{e.negativeMarks > 0 ? `${e.negativeMarks} marks` : 'No negative marks'}</div>
                        </div>
                        <button
                          onClick={() => onStartExam(e.id)}
                          className="flex items-center space-x-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs hover:shadow-indigo-100 transition"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Start Assessment</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* INTERACTIVE PRACTICE MODE TAB */}
          {activeTab === 'practice' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-xl text-slate-900">Test Yourself - Practice Arena</h2>
                  <p className="text-xs text-slate-500">Practice questions, toggle bookmarks, and view explanations instantly.</p>
                </div>
                
                {/* Filters Row */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <select 
                      value={practiceTopic} 
                      onChange={(e) => setPracticeTopic(e.target.value)}
                      className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Topics</option>
                      <option value="Java">Java</option>
                      <option value="SQL">SQL</option>
                      <option value="WebDev">WebDev</option>
                      <option value="Python">Python</option>
                      <option value="C++">C++</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Go">Go</option>
                    </select>
                  </div>

                  <select 
                    value={practiceDifficulty} 
                    onChange={(e) => setPracticeDifficulty(e.target.value)}
                    className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {practiceQuestions.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-100 rounded-xl">
                  <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No questions found matching selected filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
                  
                  {/* Practice Progress Bar */}
                  <div className="bg-slate-55 relative h-1.5 w-full">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${((currentPracticeIdx + 1) / practiceQuestions.length) * 100}%` }}
                    ></div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        Question {currentPracticeIdx + 1} of {practiceQuestions.length}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          practiceQuestions[currentPracticeIdx].difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                          practiceQuestions[currentPracticeIdx].difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {practiceQuestions[currentPracticeIdx].difficulty}
                        </span>
                        <button 
                          onClick={() => handleToggleBookmark(practiceQuestions[currentPracticeIdx].id, practiceQuestions[currentPracticeIdx].examId)}
                          className={`p-1.5 rounded hover:bg-slate-100 transition ${bookmarks.some(b => b.id === practiceQuestions[currentPracticeIdx].id) ? 'text-indigo-600' : 'text-slate-400'}`}
                          title="Bookmark Question"
                        >
                          <Bookmark className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="font-display font-medium text-slate-800 text-sm md:text-base leading-relaxed">
                      {practiceQuestions[currentPracticeIdx].text}
                    </p>

                    {/* Question Options / Code template */}
                    <div className="space-y-3">
                      {practiceQuestions[currentPracticeIdx].type === 'Coding' ? (
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 font-mono">CODE WORKSPACE:</label>
                          <textarea
                            value={selectedPracticeAns || practiceQuestions[currentPracticeIdx].codeTemplate || ''}
                            onChange={(e) => setSelectedPracticeAns(e.target.value)}
                            disabled={practiceSubmitted}
                            rows={8}
                            className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                          ></textarea>
                        </div>
                      ) : practiceQuestions[currentPracticeIdx].type === 'MultipleCorrect' ? (
                        <div className="grid grid-cols-1 gap-2">
                          {practiceQuestions[currentPracticeIdx].options?.map((option: string) => {
                            const isChecked = Array.isArray(selectedPracticeAns) && selectedPracticeAns.includes(option);
                            return (
                              <button
                                key={option}
                                disabled={practiceSubmitted}
                                onClick={() => {
                                  const current = Array.isArray(selectedPracticeAns) ? [...selectedPracticeAns] : [];
                                  if (current.includes(option)) {
                                    setSelectedPracticeAns(current.filter(item => item !== option));
                                  } else {
                                    setSelectedPracticeAns([...current, option]);
                                  }
                                }}
                                className={`p-3 text-left rounded-lg text-xs font-semibold border transition flex items-center space-x-3 ${
                                  isChecked 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                                }`}
                              >
                                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                  {isChecked && '✓'}
                                </span>
                                <span>{option}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {(practiceQuestions[currentPracticeIdx].options || ['True', 'False']).map((option: string) => (
                            <button
                              key={option}
                              disabled={practiceSubmitted}
                              onClick={() => setSelectedPracticeAns(option)}
                              className={`p-3 text-left rounded-lg text-xs font-semibold border transition ${
                                selectedPracticeAns === option 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Explanation / Results Area */}
                    {practiceSubmitted && practiceResult && (
                      <div className={`p-4 rounded-lg space-y-2 border ${
                        practiceResult.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                      }`}>
                        <div className="font-bold text-xs flex items-center space-x-2">
                          <CheckCircle className={`h-4 w-4 ${practiceResult.isCorrect ? 'text-emerald-500' : 'text-red-400'}`} />
                          <span>{practiceResult.isCorrect ? 'Correct Answer!' : 'Incorrect. Try reviewing the concepts.'}</span>
                        </div>
                        <p className="text-xs leading-relaxed"><span className="font-bold">Explanation:</span> {practiceResult.explanation}</p>
                        <p className="text-[11px] font-semibold">Correct Answer was: <span className="underline font-mono">{Array.isArray(practiceResult.correctAnswer) ? practiceResult.correctAnswer.join(', ') : String(practiceResult.correctAnswer)}</span></p>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                      <button
                        disabled={currentPracticeIdx === 0}
                        onClick={() => {
                          setCurrentPracticeIdx(prev => prev - 1);
                          setSelectedPracticeAns(null);
                          setPracticeSubmitted(false);
                          setPracticeResult(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold transition disabled:opacity-30"
                      >
                        Previous
                      </button>

                      {!practiceSubmitted ? (
                        <button
                          onClick={handlePracticeSubmit}
                          disabled={selectedPracticeAns === null}
                          className="py-1.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 shadow-xs"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (currentPracticeIdx < practiceQuestions.length - 1) {
                              setCurrentPracticeIdx(prev => prev + 1);
                              setSelectedPracticeAns(null);
                              setPracticeSubmitted(false);
                              setPracticeResult(null);
                            } else {
                              onShowToast?.('Practice set completed! Resetting filters or select another topic.', 'info');
                            }
                          }}
                          className="py-1.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition"
                        >
                          {currentPracticeIdx === practiceQuestions.length - 1 ? 'Finish Practice' : 'Next Question'}
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-xl text-slate-900">Global Leaderboard Ratings</h2>
                  <p className="text-xs text-slate-500">Track streaks, exam accuracies, and total mock scores of top scholars.</p>
                </div>

                {/* Duration Filter */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setLeaderboardTime('daily')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${leaderboardTime === 'daily' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setLeaderboardTime('weekly')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${leaderboardTime === 'weekly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setLeaderboardTime('monthly')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${leaderboardTime === 'monthly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                        <th className="p-4 w-16 text-center">Rank</th>
                        <th className="p-4">Candidate</th>
                        <th className="p-4">College/Organization</th>
                        <th className="p-4 text-center">Practice Streak</th>
                        <th className="p-4 text-center">Average Accuracy</th>
                        <th className="p-4 text-center">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-slate-400">No leaderboard logs compiled yet. Take exams to trigger ratings!</td>
                        </tr>
                      ) : (
                        leaderboard.map((item, idx) => (
                          <tr key={idx} className={`text-xs hover:bg-slate-50/50 transition ${item.userId === user.id ? 'bg-indigo-50/20' : ''}`}>
                            <td className="p-4 text-center">
                              {item.rank === 1 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-amber-100 text-amber-700 font-bold items-center justify-center text-[11px] shadow-xs">1</span>
                              ) : item.rank === 2 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-slate-100 text-slate-600 font-bold items-center justify-center text-[11px] shadow-xs">2</span>
                              ) : item.rank === 3 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-amber-50 text-amber-900 font-bold items-center justify-center text-[11px] shadow-xs">3</span>
                              ) : (
                                <span className="font-mono text-slate-400">{item.rank}</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{item.name}</div>
                            </td>
                            <td className="p-4 text-slate-500 font-medium">{item.college}</td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center space-x-1 font-bold text-amber-600">
                                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                <span>{item.streak}d</span>
                              </span>
                            </td>
                            <td className="p-4 text-center font-semibold text-emerald-600">{item.accuracy}%</td>
                            <td className="p-4 text-center font-bold text-slate-900">{item.totalScore} pts</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DISCUSSION BOARD TAB */}
          {activeTab === 'discussions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-xl text-slate-900">Discussion Forum</h2>
                  <p className="text-xs text-slate-500">Ask questions, share test codes, and discuss complex exam problems.</p>
                </div>

                {/* Topic selector */}
                <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
                  {['General', 'Java', 'SQL', 'WebDev', 'Python', 'C++', 'JavaScript', 'Go'].map(t => (
                    <button
                      key={t}
                      onClick={() => setDiscussionTopic(t)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition shrink-0 ${discussionTopic === t ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {discussions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No discussions under {discussionTopic} topic yet. Start the thread!</p>
                ) : (
                  discussions.map(msg => (
                    <div key={msg.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{msg.userName}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            msg.userRole === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {msg.userRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handlePostDiscussion} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex space-x-3 items-end">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder={`Post new message under #${discussionTopic}...`}
                  rows={2}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-indigo-100 transition flex items-center space-x-1.5 h-10 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* PROFILE & CERTIFICATES TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6 gap-4">
                  <img 
                    src={profileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
                    alt="Avatar" 
                    className="h-20 w-20 rounded-full object-cover border-2 border-indigo-100"
                  />
                  
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h2 className="font-display font-bold text-xl text-slate-800">{profileName || user.name}</h2>
                    <p className="text-xs text-indigo-600 font-bold">{profileEducation || 'Independent CS Learner'}</p>
                    
                    {/* Skills list tags */}
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                      {profileSkills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="py-1.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                  >
                    {editingProfile ? 'Cancel' : 'Edit profile info'}
                  </button>
                </div>

                {editingProfile && (
                  <div className="mt-6 border-t border-slate-50 pt-6 space-y-4 max-w-lg">
                    <h3 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Update Profile Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Full Name</label>
                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Education / College</label>
                        <input 
                          type="text" 
                          value={profileEducation} 
                          onChange={(e) => setProfileEducation(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Avatar Image Link</label>
                        <input 
                          type="text" 
                          value={profileAvatar} 
                          placeholder="Image HTTP url"
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Skills (Comma sep)</label>
                        <input 
                          type="text" 
                          value={profileSkills} 
                          placeholder="e.g. Java, Python, SQL"
                          onChange={(e) => setProfileSkills(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 border-t border-slate-50 pt-4">
                      <label className="text-xs font-semibold text-slate-600">Resume Upload (Mock)</label>
                      <div className="flex items-center space-x-3 mt-1">
                        <input 
                          type="file" 
                          id="resume-file" 
                          className="hidden" 
                          onChange={() => setResumeFileUploaded(true)}
                        />
                        <label 
                          htmlFor="resume-file" 
                          className="py-1.5 px-4 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
                        >
                          Choose PDF file
                        </label>
                        <span className="text-xs text-slate-400">
                          {resumeFileUploaded ? '✓ Resume_Lovelace_2026.pdf uploaded' : 'Supported formats: PDF, DOC'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition mt-2 shadow-xs"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Certificates Credentials list */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-sm text-slate-800">Earned Certifications</h3>
                  <p className="text-xs text-slate-400">Awarded for high mock-exam scoring (accuracy &ge; 80%).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6">No certificates issued yet. Score 80% or higher in scheduled mock exams to generate certificates!</p>
                  ) : (
                    certificates.map(cert => (
                      <div key={cert.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex justify-between items-center hover:border-amber-100 transition">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span className="font-display font-bold text-xs text-slate-700">Official Exam Certificate</span>
                          </div>
                          <h4 className="font-display font-bold text-slate-800 text-sm">{cert.examTitle}</h4>
                          <div className="text-[10px] text-slate-400">Issued Date: {cert.issueDate} | ID: {cert.credentialId}</div>
                        </div>

                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition"
                          title="View Certificate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Certificate Viewer Popover Overlay */}
      {selectedCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
          <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            
            {/* Action Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-slate-600">Verifiable CS Credential</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Template Core */}
            <div className="p-12 text-center space-y-8 bg-slate-50/50 border-8 border-double border-slate-200 m-4 relative overflow-hidden">
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-300"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-300"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-300"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-300"></div>

              <div className="space-y-2">
                <Award className="h-14 w-14 text-amber-500 mx-auto fill-amber-100" />
                <h1 className="font-display font-bold text-2xl tracking-widest text-slate-800 uppercase">
                  Certificate of Achievement
                </h1>
                <p className="text-xs text-slate-400 italic tracking-wider">This credential verifies skill competency</p>
              </div>

              <div className="space-y-2 py-4">
                <p className="text-xs text-slate-500">This is proudly presented to</p>
                <h2 className="font-display font-bold text-3xl text-indigo-700 tracking-wide underline decoration-indigo-200">
                  {selectedCert.userName}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-2">
                  for demonstrating outstanding proficiency and passing the professional mock-exam assessment with an excellent score of <strong>{selectedCert.score} / {selectedCert.maxScore}</strong> (<strong>{selectedCert.percentage}% Accuracy</strong>).
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[13px] font-bold text-slate-800">{selectedCert.examTitle}</div>
                <div className="text-[10px] text-slate-400">Verifiable CS Skill Competency Designation</div>
              </div>

              {/* Signature and Issuer Details */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 text-xs">
                <div className="text-left space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ISSUED BY</div>
                  <div className="font-bold text-slate-700">ExamPro Certification Services</div>
                  <div className="text-[10px] text-slate-400">Verification ID: {selectedCert.credentialId}</div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">AUTHENTICATED BY</div>
                  <div className="font-mono italic text-slate-600 text-sm">Professor Alan Turing</div>
                  <div className="text-[10px] text-slate-400">Exam Portal Administrator</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
