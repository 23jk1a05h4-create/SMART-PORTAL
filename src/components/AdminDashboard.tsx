import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, BookOpen, AlertTriangle, MessageSquare, Plus, Trash2, 
  Settings, CheckCircle, RefreshCw, Edit, Ban, Key, CheckSquare, Eye, ShieldAlert, Radio, HelpCircle, Award,
  Palette, Sun, Moon, Coffee, Leaf, Sparkles, Upload, Download, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Exam, Question, CheatingLog, User } from '../types';

interface AdminDashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
  onUpdateUser?: (updatedUser: any) => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminDashboard({ token, user, onLogout, onUpdateUser, theme = 'light', onThemeChange, onShowToast }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'exams' | 'questions' | 'proctor' | 'profile'>('stats');
  
  // Profile Edit States
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileEducation, setProfileEducation] = useState(user.education || 'Principal Administrator');
  const [profileSkills, setProfileSkills] = useState(user.skills?.join(', ') || 'System Design, Security Audit, Cloud Systems');
  const [profileAvatar, setProfileAvatar] = useState(user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop');
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState<any>(null);
  
  // Data lists
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [cheatingLogs, setCheatingLogs] = useState<CheatingLog[]>([]);
  
  // Create / Edit states
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  
  // Form states - Add user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'admin'>('student');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Form states - Create Exam
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newExamTopic, setNewExamTopic] = useState('Java');
  const [newExamDuration, setNewExamDuration] = useState(30);
  const [newExamNegMarks, setNewExamNegMarks] = useState(0);
  const [newExamDiff, setNewExamDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Form states - Bulk Exam Upload
  const [bulkExams, setBulkExams] = useState<any[]>([]);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkIsLoading, setBulkIsLoading] = useState(false);

  // Form states - Bulk Question Upload
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [bulkQDragOver, setBulkQDragOver] = useState(false);
  const [bulkQError, setBulkQError] = useState('');
  const [bulkQIsLoading, setBulkQIsLoading] = useState(false);

  // Form states - Create Question
  const [newQType, setNewQType] = useState<'MCQ' | 'MultipleCorrect' | 'Coding' | 'TrueFalse' | 'FillBlank'>('MCQ');
  const [newQText, setNewQText] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newQTopic, setNewQTopic] = useState('Basics');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQOptions, setNewQOptions] = useState(''); // Comma separated
  const [newQCorrectAns, setNewQCorrectAns] = useState(''); // Comma separated if MultipleCorrect, otherwise string
  const [newQCodeTemplate, setNewQCodeTemplate] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const loadAdminWorkspace = async () => {
    try {
      // Metrics
      const mRes = await fetch('/api/admin/stats', { headers });
      if (mRes.ok) setMetrics(await mRes.json());

      // Users
      const uRes = await fetch('/api/admin/users', { headers });
      if (uRes.ok) setUsers(await uRes.json());

      // Exams
      const eRes = await fetch('/api/exams', { headers });
      if (eRes.ok) {
        const examList = await eRes.json();
        setExams(examList);
        if (examList.length > 0 && !selectedExamId) {
          setSelectedExamId(examList[0].id);
        }
      }

      // Proctor Violations
      const pRes = await fetch('/api/admin/cheating-logs', { headers });
      if (pRes.ok) setCheatingLogs(await pRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAdminWorkspace();
  }, [activeTab]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          password: newUserPassword,
          education: 'Assigned by Administrator'
        })
      });
      if (res.ok) {
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        onShowToast?.('User created successfully!', 'success');
        loadAdminWorkspace();
      } else {
        const d = await res.json();
        onShowToast?.(d.error || 'Failed to register candidate.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        loadAdminWorkspace();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Exam Publish
  const handleTogglePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${id}/publish`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        loadAdminWorkspace();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExamTitle,
          description: newExamDesc,
          topic: newExamTopic,
          duration: Number(newExamDuration),
          negativeMarks: Number(newExamNegMarks),
          difficulty: newExamDiff
        })
      });
      if (res.ok) {
        const created = await res.json();
        setNewExamTitle('');
        setNewExamDesc('');
        setNewExamDuration(30);
        setSelectedExamId(created.id);
        onShowToast?.('Mock Exam configured successfully!', 'success');
        loadAdminWorkspace();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Download Excel Template for Bulk Exams
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          "Title": "Python Core Programming Mock Test",
          "Description": "Tests functional programming concepts, decorators, generators, and OOP in Python.",
          "Topic": "Python",
          "Duration": 45,
          "NegativeMarks": 0.25,
          "Difficulty": "Medium"
        },
        {
          "Title": "Go Concurrency & Channels Assessment",
          "Description": "Evaluates knowledge of goroutines, channels, select patterns, and mutex primitives.",
          "Topic": "Go",
          "Duration": 30,
          "NegativeMarks": 0,
          "Difficulty": "Hard"
        },
        {
          "Title": "SQL Indexes and Tuning Practice",
          "Description": "Exposes performance optimization tactics using index configuration and execution plan reading.",
          "Topic": "SQL",
          "Duration": 60,
          "NegativeMarks": 0.5,
          "Difficulty": "Hard"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Exams Template");
      
      // Auto-fit column widths for maximum aesthetic elegance
      const maxColWidths = sampleData.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, index) => {
          const valLen = String(row[key] || '').length;
          const keyLen = key.length;
          const maxLen = Math.max(valLen, keyLen);
          acc[index] = Math.max(acc[index] || 10, maxLen + 2);
        });
        return acc;
      }, []);
      ws['!cols'] = maxColWidths.map((w: number) => ({ wch: w }));

      XLSX.writeFile(wb, "Bulk_Exams_Template.xlsx");
      onShowToast?.("Excel template generated and downloaded!", "success");
    } catch (err) {
      console.error(err);
      onShowToast?.("Failed to generate template", "error");
    }
  };

  // Parse Excel / CSV File
  const handleParseExcel = (file: File) => {
    setBulkError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No readable binary data retrieved from spreadsheet.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!parsedRows || parsedRows.length === 0) {
          throw new Error("Spreadsheet contains zero rows of data.");
        }

        // Validate structure and map keys
        const validatedExams = parsedRows.map((row, idx) => {
          const title = row.Title || row.title || row.Name || row.name;
          const description = row.Description || row.description || row.Desc || row.desc || '';
          const topic = row.Topic || row.topic || row.Subject || row.subject || 'General';
          const duration = Number(row.Duration || row.duration || row.Time || row.time || 30);
          const negativeMarks = row.NegativeMarks !== undefined ? Number(row.NegativeMarks) : (row.negativeMarks !== undefined ? Number(row.negativeMarks) : 0.25);
          const difficulty = row.Difficulty || row.difficulty || 'Medium';

          if (!title) {
            throw new Error(`Row ${idx + 1} has an empty Title column.`);
          }

          return {
            title,
            description,
            topic,
            duration,
            negativeMarks,
            difficulty,
            published: false
          };
        });

        setBulkExams(validatedExams);
        onShowToast?.(`Successfully parsed ${validatedExams.length} examinations! Check preview below.`, "success");
      } catch (err: any) {
        console.error(err);
        setBulkError(err.message || "Failed to decode spreadsheet. Please verify headers.");
        onShowToast?.("Spreadsheet parse failure", "error");
      }
    };
    reader.onerror = () => {
      setBulkError("File reading system-level interface error.");
    };
    reader.readAsBinaryString(file);
  };

  // Commit Bulk Upload to backend
  const handleCommitBulkUpload = async () => {
    if (bulkExams.length === 0) return;
    setBulkIsLoading(true);
    try {
      const res = await fetch('/api/admin/exams/bulk', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: bulkExams })
      });

      if (res.ok) {
        const result = await res.json();
        onShowToast?.(`Bulk upload complete! Successfully added ${result.length} new examinations.`, "success");
        setBulkExams([]);
        loadAdminWorkspace();
      } else {
        const errData = await res.json();
        onShowToast?.(errData.error || "Server declined bulk import process.", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Bulk upload connection error.", "error");
    } finally {
      setBulkIsLoading(false);
    }
  };

  // Download Excel Template for Bulk Questions
  const handleDownloadQuestionsTemplate = () => {
    try {
      const sampleData = [
        {
          "Type": "MCQ",
          "Text": "Which collection class allows unique elements and maintains insertion order?",
          "Options": "HashSet, LinkedHashSet, TreeSet, ArrayList",
          "CorrectAnswer": "LinkedHashSet",
          "Difficulty": "Medium",
          "Topic": "Java Collections",
          "Explanation": "LinkedHashSet preserves the insertion order using a doubly-linked list running through all of its entries.",
          "CodeTemplate": ""
        },
        {
          "Type": "MultipleCorrect",
          "Text": "Select all elements that implement the standard List interface in Java:",
          "Options": "ArrayList, LinkedList, HashMap, Vector",
          "CorrectAnswer": "ArrayList, LinkedList, Vector",
          "Difficulty": "Easy",
          "Topic": "Java Core",
          "Explanation": "ArrayList, LinkedList, and Vector all implement the List interface. HashMap implements the Map interface.",
          "CodeTemplate": ""
        },
        {
          "Type": "TrueFalse",
          "Text": "JavaScript typeof null returns 'object'.",
          "Options": "",
          "CorrectAnswer": "True",
          "Difficulty": "Easy",
          "Topic": "JS Basics",
          "Explanation": "This is a historic behavior in JavaScript; null is primitive but typeof null evaluated to object.",
          "CodeTemplate": ""
        },
        {
          "Type": "Coding",
          "Text": "Complete the function sum(a, b) to return the summation of two numbers.",
          "Options": "",
          "CorrectAnswer": "sum(a, b) { return a + b; }",
          "Difficulty": "Easy",
          "Topic": "JavaScript",
          "Explanation": "Return the simple numeric sum.",
          "CodeTemplate": "function sum(a, b) {\n  // Write code here\n}"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions Template");

      // Auto-fit column widths
      const maxColWidths = sampleData.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, index) => {
          const valLen = String(row[key] || '').length;
          const keyLen = key.length;
          const maxLen = Math.max(valLen, keyLen);
          acc[index] = Math.max(acc[index] || 10, maxLen + 2);
        });
        return acc;
      }, []);
      ws['!cols'] = maxColWidths.map((w: number) => ({ wch: w }));

      XLSX.writeFile(wb, "Bulk_Questions_Template.xlsx");
      onShowToast?.("Questions import template downloaded!", "success");
    } catch (err) {
      console.error(err);
      onShowToast?.("Failed to generate questions template", "error");
    }
  };

  // Parse Excel / CSV Questions File
  const handleParseQuestionsExcel = (file: File) => {
    setBulkQError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No readable data retrieved from spreadsheet.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!parsedRows || parsedRows.length === 0) {
          throw new Error("Spreadsheet contains zero rows of question data.");
        }

        const validatedQuestions = parsedRows.map((row, idx) => {
          const type = row.Type || row.type || 'MCQ';
          const text = row.Text || row.text || row.Question || row.question;
          const optionsStr = String(row.Options || row.options || '');
          const correctAnsStr = String(row.CorrectAnswer !== undefined ? row.CorrectAnswer : (row.correctAnswer !== undefined ? row.correctAnswer : ''));
          const difficulty = row.Difficulty || row.difficulty || 'Medium';
          const topic = row.Topic || row.topic || 'General';
          const explanation = row.Explanation || row.explanation || '';
          const codeTemplate = row.CodeTemplate || row.codeTemplate || '';

          if (!text) {
            throw new Error(`Row ${idx + 1} has an empty Text/Question column.`);
          }
          if (!correctAnsStr) {
            throw new Error(`Row ${idx + 1} has an empty CorrectAnswer column.`);
          }

          // Parse options
          let options: string[] | undefined = undefined;
          if (type === 'MCQ' || type === 'MultipleCorrect') {
            options = optionsStr.split(',').map((o: string) => o.trim()).filter(Boolean);
            if (!options || options.length === 0) {
              throw new Error(`Row ${idx + 1} (${type}) must have comma-separated values in Options column.`);
            }
          }

          // Parse correctAnswer based on type
          let correctAnswer: any = correctAnsStr.trim();
          if (type === 'MultipleCorrect') {
            correctAnswer = correctAnsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else if (type === 'TrueFalse') {
            correctAnswer = correctAnsStr.toLowerCase() === 'true';
          }

          return {
            type,
            text,
            options,
            correctAnswer,
            difficulty,
            topic,
            explanation,
            codeTemplate
          };
        });

        setBulkQuestions(validatedQuestions);
        onShowToast?.(`Successfully parsed ${validatedQuestions.length} questions! Check preview below.`, "success");
      } catch (err: any) {
        console.error(err);
        setBulkQError(err.message || "Failed to parse questions spreadsheet. Verify columns.");
        onShowToast?.("Questions spreadsheet parse failure", "error");
      }
    };
    reader.onerror = () => {
      setBulkQError("File reading system-level interface error.");
    };
    reader.readAsBinaryString(file);
  };

  // Commit Questions Bulk Upload to backend
  const handleCommitQuestionsBulkUpload = async () => {
    if (!selectedExamId) {
      onShowToast?.("Please choose a target exam first.", "info");
      return;
    }
    if (bulkQuestions.length === 0) return;
    setBulkQIsLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/questions/import`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: bulkQuestions })
      });

      if (res.ok) {
        const result = await res.json();
        onShowToast?.(`Bulk upload complete! Successfully added ${result.length} questions to this exam.`, "success");
        setBulkQuestions([]);
        loadAdminWorkspace();
      } else {
        const errData = await res.json();
        onShowToast?.(errData.error || "Server declined bulk questions import.", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Bulk upload connection error.", "error");
    } finally {
      setBulkQIsLoading(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    if (!confirm('Warning: Deleting the exam will delete all associated question banks. Continue?')) return;
    try {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSelectedExamId('');
        loadAdminWorkspace();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Add Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      onShowToast?.('Please select an exam target first.', 'info');
      return;
    }
    try {
      let finalCorrectAns: any = newQCorrectAns;
      if (newQType === 'MultipleCorrect') {
        finalCorrectAns = newQCorrectAns.split(',').map(s => s.trim()).filter(Boolean);
      } else if (newQType === 'TrueFalse') {
        finalCorrectAns = newQCorrectAns.toLowerCase() === 'true';
      }

      const res = await fetch(`/api/admin/exams/${selectedExamId}/questions`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newQType,
          text: newQText,
          difficulty: newQDifficulty,
          topic: newQTopic,
          explanation: newQExplanation,
          options: newQOptions ? newQOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          correctAnswer: finalCorrectAns,
          codeTemplate: newQCodeTemplate || undefined
        })
      });

      if (res.ok) {
        setNewQText('');
        setNewQExplanation('');
        setNewQOptions('');
        setNewQCorrectAns('');
        setNewQCodeTemplate('');
        onShowToast?.('Question added to Exam bank!', 'success');
        loadAdminWorkspace();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save admin profile edits
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        onShowToast?.('Administrator profile saved successfully!', 'success');
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
      } else {
        onShowToast?.('Failed to save administrator profile.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      
      {/* Upper Navigation Bar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-lg text-white">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-slate-800">ExamPro Administrator</span>
        </div>

        <div className="flex items-center space-x-4">
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

          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-3 text-left hover:opacity-80 transition focus:outline-none"
            title="View Admin Profile"
          >
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{profileName || user.name}</div>
              <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Super Administrator</div>
            </div>
            <img 
              src={profileAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop"} 
              alt="Avatar" 
              className="h-9 w-9 rounded-full object-cover border border-slate-200"
            />
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
            title="Logout"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Workspace Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side menu */}
        <aside className="md:col-span-3 space-y-2">
          <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'stats' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Metrics & Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users className="h-4 w-4 text-slate-400" />
              <span>User Registrations</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'exams' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Exam Publisher</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'questions' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <HelpCircle className="h-4 w-4 text-slate-400" />
              <span>Questions Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('proctor')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'proctor' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center space-x-3">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span>Live Proctor Center</span>
              </div>
              <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold">
                {cheatingLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Award className="h-4 w-4 text-slate-400" />
              <span>Admin Profile</span>
            </button>
          </div>
        </aside>

        {/* Right Side Panel */}
        <main className="md:col-span-9 space-y-6">
          
          {/* STATS OVERVIEW */}
          {activeTab === 'stats' && metrics && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Registered Candidates</div>
                  <div className="text-2xl font-display font-bold text-slate-800 mt-1">{metrics.totalUsers}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Mock Exams</div>
                  <div className="text-2xl font-display font-bold text-slate-800 mt-1">{metrics.totalExams}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ongoing Sandbox Sessions</div>
                  <div className="text-2xl font-display font-bold text-indigo-600 mt-1">{metrics.ongoingExams}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Proctor Incidents</div>
                  <div className="text-2xl font-display font-bold text-red-600 mt-1">{metrics.totalCheatingScore}</div>
                </div>
              </div>

              {/* Security Alerts Stream Summary */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800">System Monitoring Audit Log</h3>
                <div className="space-y-3">
                  {cheatingLogs.slice(0, 4).map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">{log.userName || log.userId} ({log.userEmail})</div>
                        <p className="text-slate-500 font-medium">{log.detail}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">
                        +{log.scoreAdded} pts suspicious score
                      </span>
                    </div>
                  ))}
                  {cheatingLogs.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No security infractions captured. Portal sandbox is secure.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800">Add New Candidate Registration</h3>
                
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Candidate Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newUserName} 
                      onChange={(e) => setNewUserName(e.target.value)} 
                      placeholder="Ada Lovelace"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={newUserEmail} 
                      onChange={(e) => setNewUserEmail(e.target.value)} 
                      placeholder="email@exam.com"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Set Password</label>
                    <input 
                      type="password" 
                      required 
                      value={newUserPassword} 
                      onChange={(e) => setNewUserPassword(e.target.value)} 
                      placeholder="min 6 chars"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    Add User Profile
                  </button>
                </form>
              </div>

              {/* Users list table */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4 text-center">Practice Streak</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/40 transition">
                          <td className="p-4 font-bold text-slate-800">{u.name}</td>
                          <td className="p-4 text-slate-500">{u.email}</td>
                          <td className="p-4 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-amber-600">{u.streak || 0}d</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === user.id}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-30"
                              title="Delete Candidate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EXAM PUBLISHER TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* MANUAL CREATION */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <h3 className="font-display font-bold text-sm text-slate-800">Configure New Mock Exam</h3>
                  
                  <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Exam Title</label>
                      <input 
                        type="text" 
                        required 
                        value={newExamTitle} 
                        onChange={(e) => setNewExamTitle(e.target.value)} 
                        placeholder="e.g. Java OOP Advanced Mock Test"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Topic Area</label>
                      <select 
                        value={newExamTopic} 
                        onChange={(e) => setNewExamTopic(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      >
                        <option value="Java">Java</option>
                        <option value="SQL">SQL</option>
                        <option value="WebDev">WebDev</option>
                        <option value="Python">Python</option>
                        <option value="C++">C++</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="Go">Go</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="text-xs font-semibold text-slate-600">Short Description</label>
                      <input 
                        type="text" 
                        required 
                        value={newExamDesc} 
                        onChange={(e) => setNewExamDesc(e.target.value)} 
                        placeholder="Covers collections framework, streams operations, and sealed interfaces configurations."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        required 
                        value={newExamDuration} 
                        onChange={(e) => setNewExamDuration(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Negative Marks</label>
                      <input 
                        type="number" 
                        required 
                        value={newExamNegMarks} 
                        onChange={(e) => setNewExamNegMarks(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      Publish Mock Schema
                    </button>
                  </form>
                </div>

                {/* EXCEL BULK IMPORT */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Bulk Spreadsheet Import</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">Configure multiple exams concurrently from an Excel or CSV file.</p>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        title="Download sample template"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition flex items-center space-x-1 font-bold text-[10px] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Template</span>
                      </button>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setBulkDragOver(true);
                      }}
                      onDragLeave={() => setBulkDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setBulkDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleParseExcel(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                        bulkDragOver 
                          ? 'border-emerald-500 bg-emerald-50/50' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                      onClick={() => document.getElementById('bulk-exams-file-input')?.click()}
                    >
                      <input 
                        id="bulk-exams-file-input"
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleParseExcel(file);
                        }}
                      />
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Drag & drop your file here</p>
                      <p className="text-[10px] text-slate-400">or click to browse (.xlsx, .xls, .csv)</p>
                    </div>

                    {bulkError && (
                      <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] font-medium text-red-700 leading-snug">
                        {bulkError}
                      </div>
                    )}

                    {/* Pre-commit preview */}
                    {bulkExams.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Preview ({bulkExams.length} Exams)</span>
                          <button 
                            onClick={() => setBulkExams([])}
                            className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50 bg-slate-50/50">
                          {bulkExams.map((ex, i) => (
                            <div key={i} className="p-2 text-[10px] flex justify-between items-center">
                              <div className="truncate pr-2">
                                <p className="font-bold text-slate-700 truncate">{ex.title}</p>
                                <p className="text-slate-400 text-[9px] truncate">{ex.description || 'No description provided'}</p>
                              </div>
                              <div className="shrink-0 text-right font-semibold text-slate-500 space-y-0.5">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">{ex.topic}</span>
                                <p className="text-[9px]">{ex.duration} min</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {bulkExams.length > 0 && (
                    <button
                      onClick={handleCommitBulkUpload}
                      disabled={bulkIsLoading}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      {bulkIsLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Importing ...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Commit {bulkExams.length} Exams</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Exams lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exams.map(e => (
                  <div key={e.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase">{e.topic}</span>
                        <span className="text-xs text-slate-400 font-mono">{e.duration} mins</span>
                      </div>
                      <h4 className="font-display font-bold text-slate-800 text-sm leading-snug">{e.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{e.description}</p>
                    </div>

                    <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-xs">
                      <button
                        onClick={() => handleTogglePublish(e.id)}
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition ${
                          e.published 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {e.published ? 'Published' : 'Draft'}
                      </button>

                      <button
                        onClick={() => handleDeleteExam(e.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        Delete Mock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTIONS BANK MANAGER TAB */}
          {activeTab === 'questions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* MANUAL CREATION */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-sm text-slate-800">Add Question to Bank</h3>
                    
                    {/* Select Exam Target */}
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="">-- Choose Target Exam --</option>
                      {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>

                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Question Format</label>
                        <select 
                          value={newQType} 
                          onChange={(e) => setNewQType(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                        >
                          <option value="MCQ">Multiple Choice (MCQ)</option>
                          <option value="MultipleCorrect">Multiple Correct Choices</option>
                          <option value="TrueFalse">True or False</option>
                          <option value="Coding">Coding Sandbox Solution</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Difficulty Grade</label>
                        <select 
                          value={newQDifficulty} 
                          onChange={(e) => setNewQDifficulty(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Sub-Topic Keyword</label>
                        <input 
                          type="text" 
                          required 
                          value={newQTopic} 
                          onChange={(e) => setNewQTopic(e.target.value)} 
                          placeholder="e.g. Streams, Joins, OOP"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Question Statement Text</label>
                      <textarea 
                        required 
                        value={newQText} 
                        onChange={(e) => setNewQText(e.target.value)} 
                        rows={2}
                        placeholder="e.g. Which of the following collections implements the standard List interface?"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800 resize-none"
                      ></textarea>
                    </div>

                    {newQType === 'Coding' && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 font-mono">STARTER WORKSPACE CODE TEMPLATE:</label>
                        <textarea 
                          value={newQCodeTemplate} 
                          onChange={(e) => setNewQCodeTemplate(e.target.value)} 
                          rows={5}
                          placeholder={`// Starter code here...\npublic class Solution {\n  public static void main(String[] args) {\n    \n  }\n}`}
                          className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg focus:outline-none"
                        ></textarea>
                      </div>
                    )}

                    {newQType !== 'Coding' && newQType !== 'TrueFalse' && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Interactive Options (Comma separated options list)</label>
                        <input 
                          type="text" 
                          value={newQOptions} 
                          onChange={(e) => setNewQOptions(e.target.value)} 
                          placeholder="ArrayList, HashMap, HashSet, LinkedList"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Correct Answer(s)</label>
                      <input 
                        type="text" 
                        required 
                        value={newQCorrectAns} 
                        onChange={(e) => setNewQCorrectAns(e.target.value)} 
                        placeholder="ArrayList (Use comma separate for MultipleCorrect, or True/False value)"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Explanation Details</label>
                      <input 
                        type="text" 
                        required 
                        value={newQExplanation} 
                        onChange={(e) => setNewQExplanation(e.target.value)} 
                        placeholder="ArrayList implements the List interface using a dynamically resizable array structure internally."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="py-2 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Save Question to Sandbox
                    </button>
                  </form>
                </div>

                {/* EXCEL BULK IMPORT FOR QUESTIONS */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Bulk Questions Spreadsheet Import</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">Import multiple questions concurrently into the selected target exam using an Excel or CSV template.</p>
                      </div>
                      <button
                        onClick={handleDownloadQuestionsTemplate}
                        title="Download sample questions template"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition flex items-center space-x-1 font-bold text-[10px] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Template</span>
                      </button>
                    </div>

                    {/* Target warning */}
                    {!selectedExamId && (
                      <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-semibold">
                        ⚠️ Please choose a target exam first to enable bulk upload.
                      </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (selectedExamId) setBulkQDragOver(true);
                      }}
                      onDragLeave={() => setBulkQDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setBulkQDragOver(false);
                        if (!selectedExamId) {
                          onShowToast?.("Please select a target exam first.", "info");
                          return;
                        }
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleParseQuestionsExcel(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                        !selectedExamId 
                          ? 'border-slate-100 bg-slate-50/50 cursor-not-allowed opacity-60'
                          : bulkQDragOver 
                            ? 'border-emerald-500 bg-emerald-50/50 cursor-pointer' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!selectedExamId) {
                          onShowToast?.("Please select a target exam first.", "info");
                          return;
                        }
                        document.getElementById('bulk-questions-file-input')?.click();
                      }}
                    >
                      <input 
                        id="bulk-questions-file-input"
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                        disabled={!selectedExamId}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleParseQuestionsExcel(file);
                        }}
                      />
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Drag & drop your file here</p>
                      <p className="text-[10px] text-slate-400">or click to browse (.xlsx, .xls, .csv)</p>
                    </div>

                    {bulkQError && (
                      <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] font-medium text-red-700 leading-snug">
                        {bulkQError}
                      </div>
                    )}

                    {/* Pre-commit preview */}
                    {bulkQuestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Preview ({bulkQuestions.length} Questions)</span>
                          <button 
                            onClick={() => setBulkQuestions([])}
                            className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 bg-slate-100/50">
                          {bulkQuestions.map((q, i) => (
                            <div key={i} className="p-2 text-[10px] space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">{q.type}</span>
                                <span className="text-slate-400 text-[9px] font-semibold">{q.topic} • {q.difficulty}</span>
                              </div>
                              <p className="font-semibold text-slate-800 line-clamp-2">{q.text}</p>
                              {q.options && q.options.length > 0 && (
                                <p className="text-slate-400 text-[9px] truncate">Options: {q.options.join(', ')}</p>
                              )}
                              <p className="text-emerald-600 font-bold text-[9px]">Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {bulkQuestions.length > 0 && (
                    <button
                      onClick={handleCommitQuestionsBulkUpload}
                      disabled={bulkQIsLoading || !selectedExamId}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      {bulkQIsLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Importing Questions ...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Commit {bulkQuestions.length} Questions</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIVE PROCTOR SECURITY CENTER */}
          {activeTab === 'proctor' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="font-display font-bold text-xl text-slate-950">Secure Proctor Monitoring Audit log</h2>
                <p className="text-xs text-slate-500">Live feed capture showing student proctor warnings, tab visibility violations, copy attempts, and webcam alerts.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-4">Candidate Profile</th>
                        <th className="p-4">Exam Instance</th>
                        <th className="p-4">Detected Security Event</th>
                        <th className="p-4 text-center">Score Penalty</th>
                        <th className="p-4 text-center">Audit Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {cheatingLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">No proctor security incidents captured during active testing.</td>
                        </tr>
                      ) : (
                        cheatingLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-red-50/10 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{log.userName || log.userId}</div>
                              <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                            </td>
                            <td className="p-4 text-slate-500 font-semibold">{log.examTitle || log.examId}</td>
                            <td className="p-4">
                              <div className="flex items-center space-x-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                                <span className="font-bold text-red-700 text-[11px] uppercase">{log.type}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">{log.detail}</p>
                            </td>
                            <td className="p-4 text-center font-bold text-red-600">+{log.scoreAdded} pts</td>
                            <td className="p-4 text-center font-mono text-slate-400 text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADMINISTRATOR PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6 gap-4">
                  <img 
                    src={profileAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop"} 
                    alt="Avatar" 
                    className="h-20 w-20 rounded-full object-cover border-2 border-amber-400"
                  />
                  
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="font-display font-bold text-xl text-slate-800">{profileName || user.name}</h2>
                      <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-bold">{profileEducation || 'Principal Systems Architect'}</p>
                    
                    {/* Skills/Responsibility Tags */}
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
                    className="py-1.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs transition focus:outline-none"
                  >
                    {editingProfile ? 'Cancel' : 'Edit Admin Info'}
                  </button>
                </div>

                {editingProfile && (
                  <div className="mt-6 border-t border-slate-50 pt-6 space-y-4 max-w-lg">
                    <h3 className="font-display font-bold text-sm text-slate-800">Update Super Administrator Profile</h3>
                    
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={profileName} 
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Education / Title</label>
                          <input 
                            type="text" 
                            required
                            value={profileEducation} 
                            onChange={(e) => setProfileEducation(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Avatar Image Link</label>
                          <input 
                            type="text" 
                            required
                            value={profileAvatar} 
                            onChange={(e) => setProfileAvatar(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Expertise / Responsibilities (Comma sep)</label>
                          <input 
                            type="text" 
                            required
                            value={profileSkills} 
                            onChange={(e) => setProfileSkills(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingProfile(false)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
                        >
                          Save Credentials
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Readonly info section */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800">Security & Authentication Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Login Email Address</span>
                    <p className="font-mono text-slate-800">{user.email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Account Security Clearance</span>
                    <p className="font-mono text-amber-700 font-bold">SUPER_ADMIN_LEVEL_2</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
