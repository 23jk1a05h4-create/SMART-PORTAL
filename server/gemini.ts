import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Gemini AI client lazy-style to prevent app crashes if the key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

export interface SkillAnalysis {
  overallAssessment: string;
  weakTopics: string[];
  strongTopics: string[];
  recommendedTopics: string[];
  practiceTips: string[];
  recommendedResources: {
    title: string;
    type: 'Video' | 'PDF' | 'Documentation';
    url: string;
    description: string;
  }[];
}

// Highly detailed rule-based fallback analytics in case Gemini is offline or API key is not configured
export function getRuleBasedAnalysis(
  topic: string,
  accuracy: number,
  weakTopicsList: string[],
  strongTopicsList: string[]
): SkillAnalysis {
  const isWeak = accuracy < 70;
  
  const resourcesMap: Record<string, { title: string; type: 'Video' | 'PDF' | 'Documentation'; url: string; description: string }[]> = {
    'Java': [
      {
        title: 'Java Basics & Object-Oriented Programming (PDF)',
        type: 'PDF',
        url: 'https://docs.oracle.com/javase/tutorial/java/index.html',
        description: 'Oracle\'s official guide covering variables, classes, inheritance, polymorphism, and interfaces.',
      },
      {
        title: 'Complete Java Collections Framework Crash Course',
        type: 'Video',
        url: 'https://www.youtube.com/results?search_query=java+collections+framework+tutorial',
        description: 'Visual breakdown of List, Set, Map, and the performance properties of ArrayList vs LinkedList.',
      },
      {
        title: 'Modern Java 17 Features & Sealed Classes Guide',
        type: 'Documentation',
        url: 'https://dev.java/learn/',
        description: 'Learn records, pattern matching, switch expressions, and sealed hierarchies introduced in modern LTS versions.',
      },
    ],
    'SQL': [
      {
        title: 'SQL Join & Query Optimization Reference Sheet',
        type: 'PDF',
        url: 'https://use-the-index-luke.com/',
        description: 'A deep-dive database performance guide to indexes, join algorithms, and execution plans.',
      },
      {
        title: 'Mastering Database Normalization & Forms (1NF, 2NF, 3NF)',
        type: 'Video',
        url: 'https://www.youtube.com/results?search_query=database+normalization+explained',
        description: 'Learn the mathematical foundations of schema normalization to eliminate redundancies and anomalies.',
      },
      {
        title: 'PostgreSQL & MySQL Subqueries and Analytical Window Functions',
        type: 'Documentation',
        url: 'https://sqlbolt.com/',
        description: 'Interactive tutorials to master nested SELECT statements, aggregation groups, and PARTITION clauses.',
      },
    ],
    'WebDev': [
      {
        title: 'Deep-dive into Flexbox & CSS Grid Layout Systems',
        type: 'Video',
        url: 'https://www.youtube.com/results?search_query=css+flexbox+grid+masterclass',
        description: 'Visual guide to centering elements, dynamic alignment, responsive grids, and layout rules.',
      },
      {
        title: 'MDN Web Docs: Asynchronous JS (Promises & Async/Await)',
        type: 'Documentation',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous',
        description: 'The absolute source of truth on the event loop, callback queue, fetch promises, and concurrent flows.',
      },
      {
        title: 'Semantic HTML & Web Accessibility standards guide',
        type: 'PDF',
        url: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
        description: 'Learn accessibility best practices for designing semantic forms, tags, and custom component roles.',
      },
    ],
  };

  const defaultResources = [
    {
      title: 'Competitive Programming & Algorithm Design Masterclass',
      type: 'Video',
      url: 'https://www.youtube.com/results?search_query=coding+interview+patterns',
      description: 'Master core dynamic programming and sliding window patterns for software exams.',
    },
    {
      title: 'Full-Stack Software Architecture Cheat Sheet',
      type: 'PDF',
      url: 'https://roadmap.sh/',
      description: 'Interactive curriculum guides and reference roadmaps for modern developers.',
    }
  ];

  const resources = resourcesMap[topic] || defaultResources;

  let overallAssessment = `You scored ${accuracy}% on this ${topic} assessment. `;
  if (isWeak) {
    overallAssessment += `We detected some foundational gaps in key ${topic} subdomains. Dedicating some targeted study time on theoretical core patterns and syntax will help you bridge this performance threshold.`;
  } else {
    overallAssessment += `Fantastic performance! You demonstrated superb command of ${topic} structures and rules. Keep exploring complex edge cases to secure your expert status.`;
  }

  return {
    overallAssessment,
    weakTopics: weakTopicsList.length > 0 ? weakTopicsList : isWeak ? [`Core ${topic} Syntax`, 'Advanced Concepts'] : [],
    strongTopics: strongTopicsList.length > 0 ? strongTopicsList : isWeak ? [] : [`Core ${topic} Rules`, 'Applied Practices'],
    recommendedTopics: isWeak 
      ? (topic === 'Java' ? ['Java Basics', 'OOP', 'Collections Framework'] : topic === 'SQL' ? ['Database Joins', 'Schema Normalization'] : ['CSS Grid/Flexbox', 'Async JS'])
      : ['System Design Architectures', 'Performance Bottleneck Optimization'],
    practiceTips: isWeak 
      ? [
          'Dedicate 15 minutes daily to write pure syntax examples on a scratchpad.',
          'Always sketch out schema relations or call-stacks before writing complex nested loops.',
          'Review incorrect answers using the "Bookmark & Retry" feature inside our Practice module.'
        ]
      : [
          'Attempt writing extreme code structures to find performance bottlenecks in your algorithms.',
          'Answer community threads in our discussion board to reinforce your domain authority.',
          'Target our high-difficulty Daily Challenges to maintain your streak.'
        ],
    recommendedResources: resources as any,
  };
}

// Generate the customized AI-based analysis using the Gemini API
export async function generateAIAnalysis(
  topic: string,
  accuracy: number,
  weakTopics: string[],
  strongTopics: string[],
  score: number,
  maxScore: number,
  timeSpent: number
): Promise<SkillAnalysis> {
  const client = getAiClient();
  if (!client) {
    console.log('Gemini API client not initialized or key missing. Returning high-quality rule-based analysis.');
    return getRuleBasedAnalysis(topic, accuracy, weakTopics, strongTopics);
  }

  const prompt = `You are an elite Computer Science Professor and AI Skill Evaluator. 
A student completed a "${topic}" technical exam with the following metrics:
- Overall Score: ${score} out of ${maxScore}
- Accuracy: ${accuracy}%
- Time Spent: ${Math.floor(timeSpent / 60)} minutes and ${timeSpent % 60} seconds
- Identified Weak Subtopics: ${weakTopics.join(', ') || 'None identified'}
- Identified Strong Subtopics: ${strongTopics.join(', ') || 'None identified'}

Analyze this student's skills and return a professional diagnostic report with exact recommendations.
Include customized reference search terms or links. Format your response exactly as a JSON object matching the requested schema.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a highly analytical technical skills assessor. Output structured JSON evaluations for student exams.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['overallAssessment', 'weakTopics', 'strongTopics', 'recommendedTopics', 'practiceTips', 'recommendedResources'],
          properties: {
            overallAssessment: {
              type: Type.STRING,
              description: 'A comprehensive, warm but strict analysis of the student\'s performance, highlighting where they excelled and where they lagged.',
            },
            weakTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 1 to 4 key subtopics the student struggled with.',
            },
            strongTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 1 to 4 subtopics the student performed exceptionally well in.',
            },
            recommendedTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific recommendations of sub-domains to study next (e.g., "Java Sealed Classes" or "Joins & Normalization").',
            },
            practiceTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 practical, actionable tips to improve coding speed, conceptual retention, or reasoning.',
            },
            recommendedResources: {
              type: Type.ARRAY,
              description: 'Highly customized study assets (at least 3), referencing Videos, PDFs or official docs.',
              items: {
                type: Type.OBJECT,
                required: ['title', 'type', 'url', 'description'],
                properties: {
                  title: { type: Type.STRING },
                  type: { 
                    type: Type.STRING, 
                    enum: ['Video', 'PDF', 'Documentation'] 
                  },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim()) as SkillAnalysis;
    }
    throw new Error('Empty response from Gemini');
  } catch (err) {
    console.error('Failed to generate AI analysis via Gemini API, falling back to rule-based engine:', err);
    return getRuleBasedAnalysis(topic, accuracy, weakTopics, strongTopics);
  }
}
