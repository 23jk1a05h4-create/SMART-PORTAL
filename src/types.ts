export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  avatar?: string;
  education?: string;
  skills?: string[];
  resumeUrl?: string;
  streak: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  topic: string;
  duration: number;
  negativeMarks: number;
  published: boolean;
  scheduledAt: string;
  questionsCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type QuestionType = 'MCQ' | 'MultipleCorrect' | 'Coding' | 'TrueFalse' | 'FillBlank';

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: any;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  explanation: string;
  codeTemplate?: string;
}

export interface CheatingLog {
  id: string;
  userId: string;
  examId: string;
  type: 'TabSwitch' | 'FullscreenExit' | 'MultipleLogin' | 'CopyAttempt' | 'RightClick' | 'KeyboardShortcut' | 'FaceMissing' | 'WebcamViolation';
  timestamp: string;
  detail: string;
  scoreAdded: number;
  userName?: string;
  userEmail?: string;
  examTitle?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  examId: string;
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  issueDate: string;
  credentialId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DiscussionMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  topic: string;
  createdAt: string;
}
