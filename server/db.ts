import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'student';
  avatar?: string;
  education?: string;
  skills?: string[];
  resumeUrl?: string;
  streak: number;
  lastActive: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  topic: string;
  duration: number; // in minutes
  negativeMarks: number; // e.g., 0.25
  published: boolean;
  scheduledAt: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type QuestionType = 'MCQ' | 'MultipleCorrect' | 'Coding' | 'TrueFalse' | 'FillBlank';

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // MCQs and MultipleCorrect
  correctAnswer: any; // string for MCQ, array for MultipleCorrect, string for Coding/TrueFalse/FillBlank
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  explanation: string;
  codeTemplate?: string; // For Coding questions
  testCases?: { input: string; output: string }[]; // For Coding questions
}

export interface Answer {
  questionId: string;
  userAnswer: any; // answer selected or code written
  isCorrect: boolean;
}

export interface Result {
  id: string;
  userId: string;
  examId: string;
  score: number;
  maxScore: number;
  accuracy: number; // percentage
  timeSpent: number; // seconds
  weakTopics: string[];
  strongTopics: string[];
  completedAt: string;
  status: 'completed' | 'ongoing' | 'terminated';
  suspiciousScore: number;
  cheatingLogs: CheatingLog[];
  savedAnswers: { [questionId: string]: any };
}

export interface CheatingLog {
  id: string;
  userId: string;
  examId: string;
  type: 'TabSwitch' | 'FullscreenExit' | 'MultipleLogin' | 'CopyAttempt' | 'RightClick' | 'KeyboardShortcut' | 'FaceMissing' | 'WebcamViolation';
  timestamp: string;
  detail: string;
  scoreAdded: number;
}

export interface LoginHistory {
  id: string;
  userId: string;
  loginTime: string;
  ip: string;
  browser: string;
  device: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  examId: string;
  addedAt: string;
}

export interface PracticeHistory {
  id: string;
  userId: string;
  questionId: string;
  isCorrect: boolean;
  completedAt: string;
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

export interface Database {
  users: User[];
  exams: Exam[];
  questions: Question[];
  results: Result[];
  cheatingLogs: CheatingLog[];
  loginHistories: LoginHistory[];
  bookmarks: Bookmark[];
  practiceHistories: PracticeHistory[];
  certificates: Certificate[];
  notifications: Notification[];
  discussionMessages: DiscussionMessage[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

const extraExams: Exam[] = [
  {
    id: 'exam-python',
    title: 'Python Core & Scripting',
    description: 'Covers list comprehensions, generators, decorators, memory management, and mutable/immutable types.',
    topic: 'Python',
    duration: 15,
    negativeMarks: 0.25,
    published: true,
    scheduledAt: new Date().toISOString(),
    difficulty: 'Medium',
  },
  {
    id: 'exam-cpp',
    title: 'C++ Systems Programming & Memory Model',
    description: 'Pointers, memory management (RAII), smart pointers, virtual tables, and multiple inheritance patterns.',
    topic: 'C++',
    duration: 20,
    negativeMarks: 0.25,
    published: true,
    scheduledAt: new Date().toISOString(),
    difficulty: 'Hard',
  },
  {
    id: 'exam-javascript',
    title: 'Modern JavaScript & Async Control Flow',
    description: 'Closures, prototype chain, Event Loop, promises, async/await, and scope boundaries (let/const/var).',
    topic: 'JavaScript',
    duration: 15,
    negativeMarks: 0.25,
    published: true,
    scheduledAt: new Date().toISOString(),
    difficulty: 'Medium',
  },
  {
    id: 'exam-go',
    title: 'Go (Golang) Concurrency & Go-routines',
    description: 'Evaluate your knowledge on goroutines, channels, defer keyword, slices memory overhead, and interfaces.',
    topic: 'Go',
    duration: 10,
    negativeMarks: 0.25,
    published: true,
    scheduledAt: new Date().toISOString(),
    difficulty: 'Easy',
  }
];

const extraQuestions: Question[] = [
  // PYTHON QUESTIONS
  {
    id: 'q-py-1',
    examId: 'exam-python',
    type: 'MCQ',
    text: 'How does Python manage memory for objects?',
    options: [
      'Manual allocation and deallocation via malloc/free',
      'Automatic garbage collection using reference counting and a cyclic garbage collector',
      'By compile-time deterministic borrow checker rules',
      'No memory management is required'
    ],
    correctAnswer: 'Automatic garbage collection using reference counting and a cyclic garbage collector',
    difficulty: 'Medium',
    topic: 'Python',
    explanation: 'Python utilizes reference counting as its primary memory management mechanism, supplemented by a generational cyclic garbage collector to detect and clean up reference cycles.',
  },
  {
    id: 'q-py-2',
    examId: 'exam-python',
    type: 'MultipleCorrect',
    text: 'Select all mutable types in standard Python:',
    options: ['List', 'Tuple', 'Dictionary', 'Set', 'String'],
    correctAnswer: ['List', 'Dictionary', 'Set'],
    difficulty: 'Medium',
    topic: 'Python',
    explanation: 'Lists, Dictionaries, and Sets can be modified in-place (mutable). Tuples and Strings are immutable after creation.',
  },
  {
    id: 'q-py-3',
    examId: 'exam-python',
    type: 'TrueFalse',
    text: 'In Python, a function decorator is simply a wrapper function that takes another function as an argument and extends its behavior.',
    correctAnswer: 'True',
    difficulty: 'Easy',
    topic: 'Python',
    explanation: 'Decorators are callable objects that modify the behavior of a function or class without permanently modifying its source code.',
  },
  {
    id: 'q-py-4',
    examId: 'exam-python',
    type: 'FillBlank',
    text: 'The built-in function used to get the number of items (length) in an object is ________.',
    correctAnswer: 'len',
    difficulty: 'Easy',
    topic: 'Python',
    explanation: 'The len() function returns the length (number of items) of an object (string, list, tuple, dictionary, etc.).',
  },
  {
    id: 'q-py-5',
    examId: 'exam-python',
    type: 'Coding',
    text: 'Implement a Python function named "is_prime" that takes an integer "n" and returns True if "n" is a prime number, otherwise False.',
    correctAnswer: 'def is_prime(n):\n    if n <= 1: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True',
    difficulty: 'Medium',
    topic: 'Python',
    explanation: 'A prime number is greater than 1 and has no positive divisors other than 1 and itself. Checking up to the square root of n is a standard, efficient approach.',
    codeTemplate: 'def is_prime(n):\n    # Write your code here\n    pass',
  },

  // C++ QUESTIONS
  {
    id: 'q-cpp-1',
    examId: 'exam-cpp',
    type: 'MCQ',
    text: 'What is the purpose of the "virtual" keyword in a C++ base class function declaration?',
    options: [
      'To make the function execute faster',
      'To prevent the function from being overridden in derived classes',
      'To enable dynamic dispatch (polymorphism) so the overridden derived method is called at runtime',
      'To hide the function from derived classes'
    ],
    correctAnswer: 'To enable dynamic dispatch (polymorphism) so the overridden derived method is called at runtime',
    difficulty: 'Medium',
    topic: 'C++',
    explanation: 'The virtual keyword creates a virtual table entry, enabling dynamic/late binding at runtime based on the actual object type rather than the pointer/reference type.',
  },
  {
    id: 'q-cpp-2',
    examId: 'exam-cpp',
    type: 'MultipleCorrect',
    text: 'Select all correct smart pointer classes provided in C++11 (std:: namespace):',
    options: ['unique_ptr', 'shared_ptr', 'weak_ptr', 'auto_ptr'],
    correctAnswer: ['unique_ptr', 'shared_ptr', 'weak_ptr'],
    difficulty: 'Medium',
    topic: 'C++',
    explanation: 'unique_ptr, shared_ptr, and weak_ptr are the modern smart pointers introduced in C++11. auto_ptr was deprecated in C++11 and removed completely in C++17.',
  },
  {
    id: 'q-cpp-3',
    examId: 'exam-cpp',
    type: 'TrueFalse',
    text: 'C++ directly supports multiple class inheritance, allowing a class to inherit from more than one base class.',
    correctAnswer: 'True',
    difficulty: 'Easy',
    topic: 'C++',
    explanation: 'Yes, C++ supports multiple inheritance, although it introduces challenges like the Diamond Problem which is solved using virtual inheritance.',
  },
  {
    id: 'q-cpp-4',
    examId: 'exam-cpp',
    type: 'FillBlank',
    text: 'The operator used to access the value stored at a pointer address (dereferencing) is ________.',
    correctAnswer: '*',
    difficulty: 'Easy',
    topic: 'C++',
    explanation: 'The asterisk (*) operator dereferences a pointer, returning the object/value to which the pointer points.',
  },
  {
    id: 'q-cpp-5',
    examId: 'exam-cpp',
    type: 'Coding',
    text: 'Write a C++ function named "findMax" that takes an array of integers and its size, and returns the maximum element.',
    correctAnswer: 'int findMax(int arr[], int size) {\n    if (size <= 0) return -1;\n    int mx = arr[0];\n    for (int i = 1; i < size; i++) {\n        if (arr[i] > mx) mx = arr[i];\n    }\n    return mx;\n}',
    difficulty: 'Easy',
    topic: 'C++',
    explanation: 'Linear scan to keep track of the maximum value found so far is simple and efficient O(N) complexity.',
    codeTemplate: 'int findMax(int arr[], int size) {\n    // Write your code here\n    return 0;\n}',
  },

  // JAVASCRIPT QUESTIONS
  {
    id: 'q-js-1',
    examId: 'exam-javascript',
    type: 'MCQ',
    text: 'What is the key difference between "==" and "===" operators in JavaScript?',
    options: [
      '"==" compares only types, whereas "===" compares both value and type',
      '"==" performs implicit type conversion before comparison, whereas "===" compares value and type strictly without conversion',
      'There is no difference; they are interchangeable aliases',
      '"===" is used for objects only and "==" is for primitives'
    ],
    correctAnswer: '"==" performs implicit type conversion before comparison, whereas "===" compares value and type strictly without conversion',
    difficulty: 'Easy',
    topic: 'JavaScript',
    explanation: 'The "==" operator compares two values for equality after performing necessary type conversions. The "===" operator compares both value and type strictly.',
  },
  {
    id: 'q-js-2',
    examId: 'exam-javascript',
    type: 'MultipleCorrect',
    text: 'Select all standard array methods in JavaScript that mutate (modify) the original array in-place:',
    options: ['push', 'pop', 'concat', 'splice', 'map'],
    correctAnswer: ['push', 'pop', 'splice'],
    difficulty: 'Medium',
    topic: 'JavaScript',
    explanation: 'push, pop, and splice mutate the array. concat and map return a new array and do not alter the original.',
  },
  {
    id: 'q-js-3',
    examId: 'exam-javascript',
    type: 'TrueFalse',
    text: 'In JavaScript, evaluating "typeof null" returns the string "null".',
    correctAnswer: 'False',
    difficulty: 'Medium',
    topic: 'JavaScript',
    explanation: 'This is a long-standing bug/behavior in JavaScript. typeof null actually returns "object".',
  },
  {
    id: 'q-js-4',
    examId: 'exam-javascript',
    type: 'FillBlank',
    text: 'The keyword used to declare a block-scoped variable that can be reassigned is ________.',
    correctAnswer: 'let',
    difficulty: 'Easy',
    topic: 'JavaScript',
    explanation: 'let allows declaring variables block-scoped. const is also block-scoped but cannot be reassigned.',
  },
  {
    id: 'q-js-5',
    examId: 'exam-javascript',
    type: 'Coding',
    text: 'Write a JavaScript function named "sumArray" that takes an array of numbers and returns their sum.',
    correctAnswer: 'function sumArray(arr) {\n    return arr.reduce((acc, curr) => acc + curr, 0);\n}',
    difficulty: 'Easy',
    topic: 'JavaScript',
    explanation: 'The reduce method is a clean functional way to accumulate array elements, or a standard for loop can be used.',
    codeTemplate: 'function sumArray(arr) {\n    // Write your code here\n    return 0;\n}',
  },

  // GO QUESTIONS
  {
    id: 'q-go-1',
    examId: 'exam-go',
    type: 'MCQ',
    text: 'How are concurrent operations scheduled and run in Go?',
    options: [
      'By using OS threads directly for every function call',
      'By launching lightweight user-space threads called Goroutines managed by the Go runtime scheduler',
      'Via async/await promises mapped to hardware timers',
      'Go does not support concurrency'
    ],
    correctAnswer: 'By launching lightweight user-space threads called Goroutines managed by the Go runtime scheduler',
    difficulty: 'Medium',
    topic: 'Go',
    explanation: 'Goroutines are extremely lightweight (starting at ~2KB stack) multiplexed onto a smaller number of physical OS threads using the M:N scheduler.',
  },
  {
    id: 'q-go-2',
    examId: 'exam-go',
    type: 'MultipleCorrect',
    text: 'Which of the following are valid ways to declare or initialize a slice in Go?',
    options: [
      'var s []int',
      's := []int{1, 2, 3}',
      's := make([]int, 5)',
      's := slice(int, 5)'
    ],
    correctAnswer: ['var s []int', 's := []int{1, 2, 3}', 's := make([]int, 5)'],
    difficulty: 'Medium',
    topic: 'Go',
    explanation: 'var s []int defines a nil slice. s := []int{...} creates a slice literal. make([]int, 5) creates an initialized slice. slice(...) is not valid Go syntax.',
  },
  {
    id: 'q-go-3',
    examId: 'exam-go',
    type: 'TrueFalse',
    text: 'In Go, functions can return multiple values, enabling idiomatic error handling pattern (result, error).',
    correctAnswer: 'True',
    difficulty: 'Easy',
    topic: 'Go',
    explanation: 'Yes! Go supports multiple return values, which is commonly used for error returning like "val, err := doSomething()".',
  },
  {
    id: 'q-go-4',
    examId: 'exam-go',
    type: 'FillBlank',
    text: 'The keyword used to execute a function call concurrently in a new goroutine is ________.',
    correctAnswer: 'go',
    difficulty: 'Easy',
    topic: 'Go',
    explanation: 'The "go" keyword starts a concurrent goroutine.',
  },
  {
    id: 'q-go-5',
    examId: 'exam-go',
    type: 'Coding',
    text: 'Write a Go function named "Factorial" that takes an integer "n" and returns its factorial.',
    correctAnswer: 'func Factorial(n int) int {\n    if n <= 1 { return 1 }\n    return n * Factorial(n-1)\n}',
    difficulty: 'Easy',
    topic: 'Go',
    explanation: 'A recursive function or iterative loop can find the factorial of an integer n.',
    codeTemplate: 'package main\n\nfunc Factorial(n int) int {\n    // Write your code here\n    return 1\n}',
  }
];

// Ensure DB directory and file exist
function initDb(): Database {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data) as Database;
      
      let modified = false;

      // Ensure extra exams are in parsed
      for (const ex of extraExams) {
        if (!parsed.exams.some(e => e.id === ex.id)) {
          parsed.exams.push(ex);
          modified = true;
        }
      }

      // Ensure extra questions are in parsed
      for (const q of extraQuestions) {
        if (!parsed.questions.some(eq => eq.id === q.id)) {
          parsed.questions.push(q);
          modified = true;
        }
      }

      // Ensure the user's email has admin rights
      const user = parsed.users.find(u => u.email.toLowerCase() === '23jk1a05h4@gmail.com');
      if (user && user.role !== 'admin') {
        user.role = 'admin';
        user.id = 'admin-2';
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      return parsed;
    } catch (e) {
      console.error('Error reading database file, resetting...', e);
    }
  }

  // Seed default data
  const defaultDb: Database = {
    users: [
      {
        id: 'admin-1',
        email: 'admin@exam.com',
        password: 'admin123',
        name: 'Professor Alan Turing',
        role: 'admin',
        streak: 0,
        lastActive: new Date().toISOString(),
      },
      {
        id: 'student-1',
        email: 'student@exam.com',
        password: 'student123',
        name: 'Ada Lovelace',
        role: 'student',
        education: 'B.Tech in Computer Science',
        skills: ['Java', 'SQL', 'HTML'],
        streak: 5,
        lastActive: new Date().toISOString(),
      },
      {
        id: 'admin-2',
        email: '23jk1a05h4@gmail.com', // User's email for instant login convenience
        password: 'student123',
        name: 'Smart Candidate',
        role: 'admin',
        education: 'Bachelor of Science in Engineering',
        skills: ['Python', 'SQL', 'React'],
        streak: 12,
        lastActive: new Date().toISOString(),
      }
    ],
    exams: [
      {
        id: 'exam-java',
        title: 'Java Basics & Object-Oriented Programming',
        description: 'Comprehensive test checking core concepts of Java 17, interfaces, OOP design, collections framework, and basic coding syntax.',
        topic: 'Java',
        duration: 15,
        negativeMarks: 0.25,
        published: true,
        scheduledAt: new Date().toISOString(),
        difficulty: 'Medium',
      },
      {
        id: 'exam-sql',
        title: 'Advanced Relational Database Design & SQL Queries',
        description: 'Evaluate knowledge on normalizations, complex JOIN operations, query indexing, and stored procedures.',
        topic: 'SQL',
        duration: 20,
        negativeMarks: 0.25,
        published: true,
        scheduledAt: new Date().toISOString(),
        difficulty: 'Hard',
      },
      {
        id: 'exam-web',
        title: 'Frontend Fundamentals (HTML, CSS & JS)',
        description: 'Quick assessment of semantic markup, flexbox/grid layout systems, DOM manipulation, and asynchronous JavaScript.',
        topic: 'WebDev',
        duration: 10,
        negativeMarks: 0,
        published: true,
        scheduledAt: new Date().toISOString(),
        difficulty: 'Easy',
      },
      ...extraExams
    ],
    questions: [
      // Java Exam Questions
      {
        id: 'q-java-1',
        examId: 'exam-java',
        type: 'MCQ',
        text: 'Which of the following is NOT a feature of Java?',
        options: [
          'Object-Oriented programming style',
          'Dynamic memory management with automatic Garbage Collection',
          'Support for multiple inheritance of classes',
          'Platform independence via bytecode execution'
        ],
        correctAnswer: 'Support for multiple inheritance of classes',
        difficulty: 'Easy',
        topic: 'OOP',
        explanation: 'Java supports multiple inheritance only through interfaces, not classes, to prevent ambiguity issues like the Diamond Problem.',
      },
      {
        id: 'q-java-2',
        examId: 'exam-java',
        type: 'MultipleCorrect',
        text: 'Select all the interfaces that belong to the Java Collections Framework:',
        options: ['List', 'Map', 'Set', 'Thread'],
        correctAnswer: ['List', 'Map', 'Set'],
        difficulty: 'Medium',
        topic: 'Collections',
        explanation: 'List, Map, and Set are core interfaces of the Java Collections Framework. Thread is a class in the java.lang package representing execution threads.',
      },
      {
        id: 'q-java-3',
        examId: 'exam-java',
        type: 'TrueFalse',
        text: 'In Java 17, record classes are implicitly final and cannot be abstract.',
        correctAnswer: 'True',
        difficulty: 'Easy',
        topic: 'Java Basics',
        explanation: 'Record classes are final by design, meaning you cannot extend them, and they are automatically non-abstract.',
      },
      {
        id: 'q-java-4',
        examId: 'exam-java',
        type: 'FillBlank',
        text: 'The keyword used to prevent a subclass from overriding a method or extending a class is ________.',
        correctAnswer: 'final',
        difficulty: 'Easy',
        topic: 'OOP',
        explanation: 'The final keyword makes a class un-extendable and a method un-overridable.',
      },
      {
        id: 'q-java-5',
        examId: 'exam-java',
        type: 'Coding',
        text: 'Implement a Java function named "isPalindrome" that takes a String and returns a boolean representing whether the string reads the same backwards.',
        correctAnswer: 'public boolean isPalindrome(String str) {\n    if (str == null) return false;\n    String clean = str.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n    int len = clean.length();\n    for (int i = 0; i < len / 2; i++) {\n        if (clean.charAt(i) != clean.charAt(len - 1 - i)) {\n            return false;\n        }\n    }\n    return true;\n}',
        difficulty: 'Medium',
        topic: 'Java Basics',
        explanation: 'A palindrome can be verified by reversing the string and comparing, or using two pointers tracking inward from both ends.',
        codeTemplate: 'public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        return false;\n    }\n}',
      },

      // SQL Exam Questions
      {
        id: 'q-sql-1',
        examId: 'exam-sql',
        type: 'MCQ',
        text: 'Which SQL keyword is used to remove duplicate rows from the query results?',
        options: ['UNIQUE', 'DISTINCT', 'FILTER', 'GROUP BY'],
        correctAnswer: 'DISTINCT',
        difficulty: 'Easy',
        topic: 'Queries',
        explanation: 'The DISTINCT keyword is used to return only unique (different) values from the table.',
      },
      {
        id: 'q-sql-2',
        examId: 'exam-sql',
        type: 'MCQ',
        text: 'In relational databases, what does the ACID property "Atomicity" guarantee?',
        options: [
          'Multiple transactions can run in parallel without conflict',
          'Once a transaction is committed, it remains saved even in case of power failure',
          'A transaction is treated as a single unit, which either succeeds entirely or fails entirely',
          'A transaction will only transition the database from one valid state to another'
        ],
        correctAnswer: 'A transaction is treated as a single unit, which either succeeds entirely or fails entirely',
        difficulty: 'Medium',
        topic: 'Normalization',
        explanation: 'Atomicity ensures that all parts of a database transaction are completed successfully; if any part fails, the entire transaction is rolled back.',
      },
      {
        id: 'q-sql-3',
        examId: 'exam-sql',
        type: 'MultipleCorrect',
        text: 'Which of the following database indexes are commonly used to optimize query speeds? (Select all that apply)',
        options: ['B-Tree Index', 'Hash Index', 'Clustered Index', 'Relational Index'],
        correctAnswer: ['B-Tree Index', 'Hash Index', 'Clustered Index'],
        difficulty: 'Hard',
        topic: 'Indexes',
        explanation: 'B-Tree, Hash, and Clustered Indexes are actual database indexing techniques. Relational is a description of the database itself.',
      },
      {
        id: 'q-sql-4',
        examId: 'exam-sql',
        type: 'FillBlank',
        text: 'The JOIN operation that returns all records from the left table and the matched records from the right table is ________ JOIN.',
        correctAnswer: 'LEFT',
        difficulty: 'Easy',
        topic: 'Joins',
        explanation: 'A LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and matching records from the right table, filling with NULL where unmatched.',
      },
      {
        id: 'q-sql-5',
        examId: 'exam-sql',
        type: 'Coding',
        text: 'Write an SQL query to retrieve the second highest salary from an "Employees" table with columns "id" and "salary".',
        correctAnswer: 'SELECT MAX(salary) FROM Employees WHERE salary < (SELECT MAX(salary) FROM Employees);',
        difficulty: 'Hard',
        topic: 'Queries',
        explanation: 'Using a subquery to find salaries strictly less than the maximum salary, then selecting the maximum of those remaining gives the second-highest.',
        codeTemplate: '-- Enter your SQL query below\nSELECT ...',
      },

      // WebDev Exam Questions
      {
        id: 'q-web-1',
        examId: 'exam-web',
        type: 'MCQ',
        text: 'Which HTML5 element is used to display self-contained visual media or code blocks, often with a caption?',
        options: ['<section>', '<article>', '<figure>', '<aside>'],
        correctAnswer: '<figure>',
        difficulty: 'Easy',
        topic: 'HTML Basics',
        explanation: 'The <figure> tag specifies self-contained content, like illustrations, diagrams, photos, code listings, etc., often paired with <figcaption>.',
      },
      {
        id: 'q-web-2',
        examId: 'exam-web',
        type: 'TrueFalse',
        text: 'In JavaScript, "const" declared variables are fully immutable, meaning their object properties cannot be modified.',
        correctAnswer: 'False',
        difficulty: 'Medium',
        topic: 'JS Basics',
        explanation: 'const prevents re-assignment of the variable identifier, but object properties can still be modified (shallow immutability). Use Object.freeze() for property protection.',
      },
      {
        id: 'q-web-3',
        examId: 'exam-web',
        type: 'FillBlank',
        text: 'The standard CSS property used to align items along the primary axis of a flex container is ________-content.',
        correctAnswer: 'justify',
        difficulty: 'Easy',
        topic: 'CSS Layout',
        explanation: 'The justify-content property defines how the browser distributes space between and around content items along the main axis.',
      },
      ...extraQuestions
    ],
    results: [],
    cheatingLogs: [],
    loginHistories: [],
    bookmarks: [],
    practiceHistories: [],
    certificates: [],
    notifications: [
      {
        id: 'notif-1',
        userId: 'student-1',
        title: 'Welcome to the Exam Portal!',
        message: 'Explore active Mock Tests, practice specific coding topics, and track your streak daily.',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        userId: 'student-2',
        title: 'Exam Scheduled',
        message: 'Prof. Turing published "Java Basics & Object-Oriented Programming". Head over to Active Exams to attempt!',
        read: false,
        createdAt: new Date().toISOString(),
      }
    ],
    discussionMessages: [
      {
        id: 'msg-1',
        userId: 'student-1',
        userName: 'Ada Lovelace',
        userRole: 'student',
        text: 'Is there negative marks for the SQL quiz? The level looks hard.',
        topic: 'SQL',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-2',
        userId: 'admin-1',
        userName: 'Professor Alan Turing',
        userRole: 'admin',
        text: 'Yes Ada, the SQL test has a 0.25 negative marking policy. Try testing first in Practice Mode!',
        topic: 'SQL',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  return defaultDb;
}

let dbInMemory: Database = initDb();

function saveToDisk() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbInMemory, null, 2), 'utf-8');
}

export const dbService = {
  get: () => dbInMemory,
  
  save: () => {
    saveToDisk();
  },

  // Auth helper
  findUserByEmail: (email: string) => {
    return dbInMemory.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  addUser: (user: User) => {
    dbInMemory.users.push(user);
    saveToDisk();
    return user;
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const idx = dbInMemory.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      dbInMemory.users[idx] = { ...dbInMemory.users[idx], ...updates };
      saveToDisk();
      return dbInMemory.users[idx];
    }
    return null;
  },

  deleteUser: (id: string) => {
    dbInMemory.users = dbInMemory.users.filter(u => u.id !== id);
    saveToDisk();
  },

  // Exam Helpers
  addExam: (exam: Exam) => {
    dbInMemory.exams.push(exam);
    saveToDisk();
    return exam;
  },

  updateExam: (id: string, updates: Partial<Exam>) => {
    const idx = dbInMemory.exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      dbInMemory.exams[idx] = { ...dbInMemory.exams[idx], ...updates };
      saveToDisk();
      return dbInMemory.exams[idx];
    }
    return null;
  },

  deleteExam: (id: string) => {
    dbInMemory.exams = dbInMemory.exams.filter(e => e.id !== id);
    dbInMemory.questions = dbInMemory.questions.filter(q => q.examId !== id);
    saveToDisk();
  },

  // Question Helpers
  addQuestion: (question: Question) => {
    dbInMemory.questions.push(question);
    saveToDisk();
    return question;
  },

  updateQuestion: (id: string, updates: Partial<Question>) => {
    const idx = dbInMemory.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      dbInMemory.questions[idx] = { ...dbInMemory.questions[idx], ...updates };
      saveToDisk();
      return dbInMemory.questions[idx];
    }
    return null;
  },

  deleteQuestion: (id: string) => {
    dbInMemory.questions = dbInMemory.questions.filter(q => q.id !== id);
    saveToDisk();
  },

  // Results & Anti-cheating
  addResult: (result: Result) => {
    dbInMemory.results.push(result);
    saveToDisk();
    return result;
  },

  updateResult: (id: string, updates: Partial<Result>) => {
    const idx = dbInMemory.results.findIndex(r => r.id === id);
    if (idx !== -1) {
      dbInMemory.results[idx] = { ...dbInMemory.results[idx], ...updates };
      saveToDisk();
      return dbInMemory.results[idx];
    }
    return null;
  },

  addCheatingLog: (log: CheatingLog) => {
    dbInMemory.cheatingLogs.push(log);
    saveToDisk();
    return log;
  },

  addLoginHistory: (hist: LoginHistory) => {
    dbInMemory.loginHistories.push(hist);
    saveToDisk();
    return hist;
  },

  // Bookmarks & Practice
  toggleBookmark: (userId: string, questionId: string, examId: string) => {
    const existingIdx = dbInMemory.bookmarks.findIndex(b => b.userId === userId && b.questionId === questionId);
    if (existingIdx !== -1) {
      dbInMemory.bookmarks.splice(existingIdx, 1);
      saveToDisk();
      return { bookmarked: false };
    } else {
      const b: Bookmark = {
        id: 'bookmark-' + Math.random().toString(36).substr(2, 9),
        userId,
        questionId,
        examId,
        addedAt: new Date().toISOString()
      };
      dbInMemory.bookmarks.push(b);
      saveToDisk();
      return { bookmarked: true, bookmark: b };
    }
  },

  addPracticeHistory: (hist: PracticeHistory) => {
    dbInMemory.practiceHistories.push(hist);
    saveToDisk();
    return hist;
  },

  addCertificate: (cert: Certificate) => {
    dbInMemory.certificates.push(cert);
    saveToDisk();
    return cert;
  },

  addNotification: (notif: Notification) => {
    dbInMemory.notifications.push(notif);
    saveToDisk();
    return notif;
  },

  markNotificationsRead: (userId: string) => {
    dbInMemory.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    saveToDisk();
  },

  addDiscussionMessage: (msg: DiscussionMessage) => {
    dbInMemory.discussionMessages.push(msg);
    saveToDisk();
    return msg;
  }
};
