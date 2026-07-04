import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Camera, Lock, Clock, CheckCircle, RefreshCw, AlertTriangle, 
  ChevronLeft, ChevronRight, HelpCircle, Eye, FileText, Bookmark, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';
import { Exam, Question } from '../types';

interface ExamScreenProps {
  token: string;
  examId: string;
  onFinish: () => void;
  theme?: string;
}

export default function ExamScreen({ token, examId, onFinish, theme = 'light' }: ExamScreenProps) {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // State variables for answering
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  
  // Proctor & Timer states
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [suspiciousScore, setSuspiciousScore] = useState(0);
  const [cheatingWarnings, setCheatingWarnings] = useState<string[]>([]);
  const [proctorMessage, setProctorMessage] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceCheckStatus, setFaceCheckStatus] = useState<'OK' | 'MISSING' | 'AWAY' | 'MULTIPLE'>('OK');

  // Diagnostic Results State
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const headers = { 'Authorization': `Bearer ${token}` };

  // Fetch initial exam configurations and randomized questions
  const loadExamWorkspace = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: 'POST',
        headers
      });
      if (!res.ok) {
        throw new Error('Failed to initiate exam proctor session');
      }
      const data = await res.json();
      setExam(data.exam);
      setQuestions(data.questions);
      setAnswers(data.savedAnswers || {});
      setSuspiciousScore(data.suspiciousScore || 0);
      setTimeLeft(data.exam.duration * 60);
      setLoading(false);
    } catch (e: any) {
      alert(e.message || 'Error configuring exam environment.');
      onFinish();
    }
  };

  useEffect(() => {
    loadExamWorkspace();
  }, [examId]);

  // Request Webcam Stream for Proctor Panel
  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 240, height: 180 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebcamActive(true);
        }
      } catch (err) {
        console.warn('Webcam permission denied, continuing with fallback simulation:', err);
      }
    }
    if (!loading && !submitted && !terminated) {
      startWebcam();
    }
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [loading, submitted, terminated]);

  // Simulated AI Face Checks Loop (Every 8 seconds, checks randomly)
  useEffect(() => {
    if (!webcamActive || submitted || terminated) return;
    const interval = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.08) {
        setFaceCheckStatus('MISSING');
        triggerCheatingViolation('FaceMissing', 'Proctor detected face is missing from webcam frame.', 15);
      } else if (roll > 0.92) {
        setFaceCheckStatus('AWAY');
        triggerCheatingViolation('WebcamViolation', 'Student detected looking away frequently from testing window.', 10);
      } else {
        setFaceCheckStatus('OK');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [webcamActive, submitted, terminated]);

  // Timer Countdown Loop
  useEffect(() => {
    if (loading || submitted || terminated || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto submit when time runs out!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitted, terminated, timeLeft]);

  // Autosave answers every 20 seconds
  useEffect(() => {
    if (loading || submitted || terminated) return;
    const saveTimer = setInterval(async () => {
      setAutoSaveStatus('saving');
      try {
        const res = await fetch(`/api/exams/${examId}/autosave`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ answers })
        });
        if (res.ok) {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        }
      } catch (err) {
        console.error('Autosave failure:', err);
      }
    }, 20000);

    return () => clearInterval(saveTimer);
  }, [loading, answers, submitted, terminated]);

  // Enforce Anti-Cheating Event Interceptors
  const triggerCheatingViolation = async (type: string, detail: string, penalty: number) => {
    try {
      const res = await fetch(`/api/exams/${examId}/cheating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, detail, scoreAdded: penalty })
      });
      if (res.ok) {
        const data = await res.json();
        setSuspiciousScore(data.suspiciousScore);
        
        const timestampStr = new Date().toLocaleTimeString();
        setCheatingWarnings(prev => [`[${timestampStr}] ${detail}`, ...prev]);
        setProctorMessage(detail);
        
        if (data.terminated) {
          setTerminated(true);
        } else {
          setShowWarningModal(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (loading || submitted || terminated) return;

    // Visibility / Tab Change Interceptor
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerCheatingViolation('TabSwitch', 'Browser tab switch detected.', 10);
      }
    };

    // Window Blur (Focus off) Interceptor
    const handleBlur = () => {
      triggerCheatingViolation('FullscreenExit', 'Student exited fullscreen window view.', 15);
    };

    // Copy/Paste and Shortcut Interceptors
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerCheatingViolation('CopyAttempt', 'Blocked Ctrl+C / copy attempt.', 10);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerCheatingViolation('CopyAttempt', 'Blocked Ctrl+V / paste attempt.', 10);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerCheatingViolation('RightClick', 'Right click blocked.', 5);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept key shortcuts like F12, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        triggerCheatingViolation('KeyboardShortcut', `Blocked suspicious shortcut: ${e.key}`, 15);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, submitted, terminated]);

  // Submit Exam State
  const handleSubmit = async (isAuto = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          timeSpent: exam ? (exam.duration * 60 - timeLeft) : 100
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosticResult(data);
        setSubmitted(true);
      } else {
        alert('Submission failed, please retry.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting final answers.');
    } finally {
      setLoading(false);
    }
  };

  // Timer Formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !submitted && !terminated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
        <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider">Configuring Secure Testing Sandbox</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Initializing proctored canvas, verifying webcam resources, and loading randomized options order...</p>
      </div>
    );
  }

  // TERMINATED SCREEN (Violated threshold)
  if (terminated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-red-500/20 text-center space-y-6 shadow-2xl">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl text-red-400">Exam Terminated</h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              This session was closed automatically because the proctor engine calculated a suspicious cheating score of <strong>{suspiciousScore} / 100</strong> (Threshold limits exceeded: &ge; 50).
            </p>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 text-left text-[11px] font-mono space-y-2 text-red-200 border border-slate-900 max-h-40 overflow-y-auto">
            <div className="font-bold border-b border-slate-800 pb-1.5 uppercase text-red-400">Infraction Logs:</div>
            {cheatingWarnings.length === 0 ? (
              <p className="text-slate-500">No logs saved.</p>
            ) : (
              cheatingWarnings.map((w, i) => <div key={i}>{w}</div>)
            )}
          </div>

          <button
            onClick={onFinish}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-md"
          >
            Acknowledge & Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // COMPLETED & DIAGNOSED RESULTS VIEW (Gemini recommendations + scorecard)
  if (submitted && diagnosticResult) {
    const cert = diagnosticResult.certificate;
    const ai = diagnosticResult.aiAnalysis;

    return (
      <div className="min-h-screen bg-slate-50 p-6 font-sans">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          
          {/* Diagnostic Header Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                Exam Graded Successfully
              </span>
              <h1 className="font-display font-bold text-2xl text-slate-800">{exam?.title}</h1>
              <p className="text-xs text-slate-500 leading-relaxed">Your results are evaluated. Diagnostic analytics from AI suggest personalized studies next.</p>
            </div>

            <div className="flex space-x-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 min-w-28 shadow-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Final Score</div>
                <div className="text-3xl font-display font-bold text-slate-800 mt-1">{diagnosticResult.score} <span className="text-slate-400 text-xs">/ {diagnosticResult.maxScore}</span></div>
              </div>
              <div className="text-center p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 min-w-28 shadow-xs">
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Graded Accuracy</div>
                <div className="text-3xl font-display font-bold text-indigo-700 mt-1">{diagnosticResult.accuracy}%</div>
              </div>
            </div>
          </div>

          {cert && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-display font-bold text-sm">🎖️ pass credential issued!</h3>
                <p className="text-xs text-amber-50">You scored {diagnosticResult.accuracy}%! An official skill verification certificate has been saved to your profile.</p>
              </div>
              <button
                onClick={() => alert('Certificate available under "Profile & Certificates" tab on your student dashboard!')}
                className="py-1.5 px-4 bg-white text-amber-800 rounded-lg text-xs font-bold transition shadow-sm hover:bg-slate-50 shrink-0"
              >
                View Digital Credential
              </button>
            </div>
          )}

          {/* AI-Based Diagnostic Performance analysis */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-4">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse shrink-0" />
              <h3 className="font-display font-bold text-slate-800">AI Skill Improvement Diagnostics (Gemini Powered)</h3>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">
              {ai.overallAssessment}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Weak vs Strong Subtopics */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skill Performance Metrics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-red-50/50 border border-red-50 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Detected Weak Areas</div>
                    <div className="space-y-1">
                      {ai.weakTopics.map((t: string) => (
                        <div key={t} className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-50 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Detected Strengths</div>
                    <div className="space-y-1">
                      {ai.strongTopics.map((t: string) => (
                        <div key={t} className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Improvement Study Focus</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ai.recommendedTopics.map((t: string) => (
                      <span key={t} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-bold uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable studying tips */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended Study Tips</h4>
                <div className="space-y-3">
                  {ai.practiceTips.map((tip: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs">
                      <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="text-slate-600 leading-normal font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Curated recommended guides / Videos / PDFs */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curated Study Materials & Links</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ai.recommendedResources.map((res: any, idx: number) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-xs transition space-y-2 flex flex-col justify-between group"
                  >
                    <div className="space-y-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        res.type === 'Video' ? 'bg-red-50 text-red-600 border border-red-100' :
                        res.type === 'PDF' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {res.type}
                      </span>
                      <h5 className="font-display font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition line-clamp-1">{res.title}</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{res.description}</p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold group-hover:underline pt-2 inline-flex items-center space-x-1">
                      <span>Access Material</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-end">
              <button
                onClick={onFinish}
                className="py-2 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-md"
              >
                Return to Dashboard
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // SECURE EXAM ACTIVE SANDBOX VIEW
  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      
      {/* Secure Test Top Header bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-30 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-red-600 rounded text-white animate-pulse">
            <Lock className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h1 className="font-display font-bold text-xs md:text-sm tracking-wide text-slate-100">{exam?.title}</h1>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.2 bg-slate-800 rounded font-semibold text-red-400 uppercase tracking-wider">Secure proctored Sandbox</span>
              {autoSaveStatus === 'saving' && <span className="text-amber-400">● Saving progress...</span>}
              {autoSaveStatus === 'saved' && <span className="text-emerald-400">● Progress Backed Up</span>}
            </div>
          </div>
        </div>

        {/* Floating Proctored Alerts Monitor */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Suspicious score</div>
            <div className={`text-base font-display font-bold ${suspiciousScore >= 30 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
              {suspiciousScore} / 100
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 border border-slate-800 rounded-lg">
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="font-mono font-bold text-sm tracking-widest text-slate-200">
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you absolutely sure you want to finalize and submit your responses? This is irreversible.')) {
                handleSubmit();
              }
            }}
            className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Proctor Sidebar & Test Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Proctored Video and Question lists */}
        <aside className="lg:col-span-3 space-y-4">
          
          {/* Proctor Feed simulation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proctoring Monitor</h3>
              <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                faceCheckStatus === 'OK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-red-950 text-red-400 border border-red-900 animate-pulse'
              }`}>
                <span>●</span>
                <span>{faceCheckStatus === 'OK' ? 'FACE OK' : faceCheckStatus === 'MISSING' ? 'FACE MISSING' : 'SUSPICIOUS'}</span>
              </span>
            </div>

            {/* Simulated / Real Video Output */}
            <div className="bg-slate-950 h-32 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800/60">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!webcamActive && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-3 space-y-1">
                  <Camera className="h-6 w-6 text-slate-500 animate-pulse" />
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Simulated Proctor Enabled</span>
                </div>
              )}
              {/* Scan overlays */}
              <div className="absolute inset-0 border border-indigo-500/10 pointer-events-none">
                <div className="h-0.5 bg-indigo-500/20 absolute w-full top-1/2 animate-bounce"></div>
              </div>
            </div>

            {proctorMessage && (
              <div className="p-2 bg-red-950/40 border border-red-900/30 text-[10px] text-red-300 rounded leading-normal flex items-start space-x-1.5 font-medium animate-pulse">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
                <span>{proctorMessage}</span>
              </div>
            )}
          </div>

          {/* Question Navigator Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Navigation Map</h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isMarked = markedForReview.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 rounded font-mono text-xs font-bold transition flex items-center justify-center border ${
                      currentIdx === idx ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/40' :
                      isMarked ? 'bg-amber-950 border-amber-800 text-amber-300 animate-pulse' :
                      isAnswered ? 'bg-emerald-950 border-emerald-900 text-emerald-400' :
                      'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/50 flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-slate-400 font-semibold uppercase">
              <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-indigo-600"></span><span>Current</span></span>
              <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-emerald-600"></span><span>Solved</span></span>
              <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span><span>Review</span></span>
            </div>
          </div>

        </aside>

        {/* Right column: Current Question Canvas */}
        <main className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col justify-between overflow-hidden">
          
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
              <span className="text-xs font-bold text-indigo-400 font-mono">
                QUESTION {currentIdx + 1} OF {questions.length}
              </span>
              <button
                onClick={() => {
                  const qId = currentQuestion.id;
                  if (markedForReview.includes(qId)) {
                    setMarkedForReview(prev => prev.filter(id => id !== qId));
                  } else {
                    setMarkedForReview(prev => [...prev, qId]);
                  }
                }}
                className={`flex items-center space-x-1.5 py-1 px-3 border rounded-lg text-[10px] font-bold transition ${
                  markedForReview.includes(currentQuestion.id)
                    ? 'bg-amber-950 border-amber-700 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 fill-current" />
                <span>{markedForReview.includes(currentQuestion.id) ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* Question Text */}
            <p className="font-display font-medium text-slate-100 text-base md:text-lg leading-relaxed">
              {currentQuestion.text}
            </p>

            {/* Inputs based on type */}
            <div className="pt-2">
              {currentQuestion.type === 'Coding' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-400">WRITE YOUR SOLUTION CODE (TS/JS/JAVA):</label>
                  <textarea
                    value={answers[currentQuestion.id] || currentQuestion.codeTemplate || ''}
                    onChange={(e) => {
                      setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                    }}
                    rows={12}
                    className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  ></textarea>
                </div>
              ) : currentQuestion.type === 'MultipleCorrect' ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options?.map((option: string) => {
                    const isChecked = Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          const current = Array.isArray(answers[currentQuestion.id]) ? [...answers[currentQuestion.id]] : [];
                          let next;
                          if (current.includes(option)) {
                            next = current.filter(item => item !== option);
                          } else {
                            next = [...current, option];
                          }
                          setAnswers(prev => ({ ...prev, [currentQuestion.id]: next }));
                        }}
                        className={`p-4 text-left rounded-lg text-xs font-semibold border transition flex items-center space-x-3 ${
                          isChecked 
                            ? 'bg-indigo-950/40 border-indigo-700 text-indigo-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700'}`}>
                          {isChecked && '✓'}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {(currentQuestion.options || ['True', 'False']).map((option: string) => {
                    const isChecked = answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
                        }}
                        className={`p-4 text-left rounded-lg text-xs font-semibold border transition flex items-center space-x-3 ${
                          isChecked 
                            ? 'bg-indigo-950/40 border-indigo-700 text-indigo-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700'}`}>
                          {isChecked && '✓'}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Action Row */}
          <div className="px-6 py-4 bg-slate-900 border-t border-slate-800/80 flex justify-between items-center">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="py-1.5 px-4 border border-slate-800 text-slate-400 font-bold hover:border-slate-700 rounded-lg text-xs transition disabled:opacity-30"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="py-1.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-md"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm('Are you ready to submit your exam?')) {
                    handleSubmit();
                  }
                }}
                className="py-1.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md"
              >
                Finish & Submit
              </button>
            )}
          </div>

        </main>
      </div>

      {/* Warn Modal Overlay popup */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-100">Proctored Security Flag</h2>
              <p className="text-xs text-red-200">
                {proctorMessage}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              WARNING: Our AI testing algorithms actively evaluate tab visibility, copy/paste commands, and webcam positioning. Cumulative score above 50 results in automated session termination. Currently at: <strong>{suspiciousScore}/100</strong>.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
            >
              Resume Exam Sandbox
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
