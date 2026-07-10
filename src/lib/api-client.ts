import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase.js";
import type {
  Scholarship,
  ScholarshipList,
  ListScholarshipsParams,
  Mentor,
  MentorList,
  ListMentorsParams,
  LearningModule,
  LearningModuleList,
  ListLearningModulesParams,
  QuizResultInput,
  QuizResult,
  MentorRequestInput,
  MentorRequest,
  MentorRequestList,
  DashboardSummary,
  ActivityFeed,
  ActivityItem,
  ConversationInput,
  Conversation,
  CareerAdviceInput,
  AiResponse,
  ResumeFeedbackInput,
  ResumeAnalysis,
  ScholarshipRecoInput,
  FinancialLiteracyInput,
  LearningPlanInput,
  InterviewQuestionsInput
} from "./api-client.schemas.js";

// Re-export all schemas
export * from "./api-client.schemas.js";

// ============================================================================
// GEMINI CLIENT SETUP
// ============================================================================
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey === "not-configured") {
    console.warn("VITE_GEMINI_API_KEY is not configured. AI features will fallback to dummy responses.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

// Gemini System Instructions
const CAREER_MENTOR_SYSTEM = `You are SakhiPath — an experienced female STEM career mentor helping Indian women navigate career transitions, growth, and challenges. You are warm, practical, and deeply knowledgeable.

Guidelines:
- Provide practical, encouraging, and actionable advice tailored to women in STEM
- Acknowledge the unique challenges faced by women in Indian STEM environments (unconscious bias, work-life balance, pay gaps)
- Never fabricate scholarships, companies, or specific program details
- Avoid harmful financial advice; always recommend consulting a certified financial advisor for specific financial decisions
- Respond in Markdown with clear headings and bullet points
- Keep answers structured, concise, and empowering
- Celebrate wins and normalize setbacks as part of the journey
- Use inclusive, encouraging language`;

const RESUME_SYSTEM = `You are an expert resume coach and hiring manager with 15+ years in the STEM industry. Analyze resumes objectively and provide structured, actionable feedback.

Guidelines:
- Be honest but constructive — highlight genuine strengths, not just positives
- Focus on impact-oriented language and quantifiable achievements
- Consider the specific challenges women face in STEM hiring
- Respond ONLY with valid JSON in this exact format:
{
  "score": <integer 0-100>,
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "improvements": ["string", ...],
  "summary": "string"
}`;

const SCHOLARSHIP_SYSTEM = `You are a scholarship advisor specializing in opportunities for women in STEM in India and internationally.

Guidelines:
- NEVER fabricate scholarship names, amounts, or deadlines
- Only reference well-known, verified scholarship programs (INSPIRE, KVPY, Inlaks, Fulbright, etc.)
- Provide eligibility criteria and application tips
- Suggest both government schemes and private/NGO scholarships
- Respond in Markdown with organized sections`;

const FINANCIAL_SYSTEM = `You are a financial literacy educator helping women in STEM understand personal finance and wealth building.

Guidelines:
- Explain concepts clearly using simple analogies
- Reference Indian financial instruments (PPF, NPS, ELSS, SIP, etc.) where relevant
- Always recommend consulting a SEBI-registered financial advisor for personalized advice
- Never provide specific investment recommendations
- Respond in Markdown with practical examples`;

// ============================================================================
// SEEDED MOCK DATA
// ============================================================================
export const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 1,
    title: "Google Generation Scholarship (APAC)",
    provider: "Google",
    amount: "$2,500 USD",
    deadline: "2026-10-15",
    eligibility: "Women pursuing Computer Science or related STEM degrees in Asia-Pacific",
    category: "STEM",
    applicationUrl: "https://buildyourfuture.withgoogle.com/scholarships",
    description: "Established to help aspiring computer scientists excel in technology and become leaders in the field.",
    isActive: true
  },
  {
    id: 2,
    title: "Adobe Research Women-in-Technology Scholarship",
    provider: "Adobe",
    amount: "$10,000 USD + Mentorship",
    deadline: "2026-11-01",
    eligibility: "Female undergraduate or master's students studying Computer Science/Engineering",
    category: "Technology",
    applicationUrl: "https://research.adobe.com/scholarship/",
    description: "Recognizing outstanding female students in tech globally and providing financial support and internship opportunities.",
    isActive: true
  },
  {
    id: 3,
    title: "Kiran Mazumdar-Shaw Biotech Fellowship",
    provider: "Biocon Foundation",
    amount: "₹2,00,000 INR",
    deadline: "2026-09-30",
    eligibility: "Indian women students pursuing postgraduate degrees in Biotechnology or Life Sciences",
    category: "Biotechnology",
    applicationUrl: "https://www.bioconfoundation.org",
    description: "Supporting women in life sciences who demonstrate strong academic record and intent to pursue research.",
    isActive: true
  },
  {
    id: 4,
    title: "L'Oréal-UNESCO For Women in Science Awards",
    provider: "UNESCO / L'Oréal",
    amount: "€100,000 EUR",
    deadline: "2026-08-31",
    eligibility: "Women scientists conducting research in Physical Sciences, Math, or Computer Science",
    category: "Science",
    applicationUrl: "https://www.forwomeninscience.com",
    description: "Identifying and supporting eminent women in science throughout the world, helping them continue their research.",
    isActive: true
  },
  {
    id: 5,
    title: "Pragati Scholarship Scheme for Girl Students",
    provider: "AICTE, Government of India",
    amount: "₹50,000 INR / year",
    deadline: "2026-12-15",
    eligibility: "Girl students admitted in first year of Degree/Diploma course in AICTE approved institution",
    category: "STEM",
    applicationUrl: "https://www.aicte-india.org",
    description: "Government scheme promoting technical education among girl students to empower them for their career development.",
    isActive: true
  },
  {
    id: 6,
    title: "Schlumberger Foundation Faculty for the Future",
    provider: "Schlumberger Foundation",
    amount: "Up to $50,000 USD / year",
    deadline: "2026-11-10",
    eligibility: "Women from developing countries preparing for PhD or post-doctoral studies in STEM",
    category: "STEM",
    applicationUrl: "https://www.facultyforthefuture.net",
    description: "Fellowships to women who are preparing for PhD or post-doctoral research in STEM at leading universities abroad.",
    isActive: true
  },
  {
    id: 7,
    title: "British Council Scholarships for Women in STEM",
    provider: "British Council",
    amount: "Fully Funded Master's Degree",
    deadline: "2026-09-15",
    eligibility: "Women from South Asia pursuing master's programs in STEM fields in the UK",
    category: "STEM",
    applicationUrl: "https://www.britishcouncil.org",
    description: "Fully funded scholarships to study master's degrees in STEM subjects at top universities across the UK.",
    isActive: true
  },
  {
    id: 8,
    title: "AWS GenerationIT Female Tech Scholarship",
    provider: "Amazon Web Services",
    amount: "$5,000 USD",
    deadline: "2026-10-30",
    eligibility: "Undergraduate women in software engineering, networking, or cloud infrastructure",
    category: "Technology",
    applicationUrl: "https://aws.amazon.com",
    description: "Supporting the next generation of female leaders in cloud computing and software systems.",
    isActive: true
  },
  {
    id: 9,
    title: "Kalpana Chawla STEM Memorial Scholarship",
    provider: "Space Development Council",
    amount: "₹1,50,000 INR",
    deadline: "2026-08-15",
    eligibility: "Indian female students pursuing aeronautical, space, or engineering degrees",
    category: "Engineering",
    applicationUrl: "https://www.isro.gov.in",
    description: "Honoring Kalpana Chawla by supporting exceptional female engineering students in India.",
    isActive: true
  },
  {
    id: 10,
    title: "Tata Trusts Women Scholarship for Neuroscience",
    provider: "Tata Trusts",
    amount: "₹3,00,000 INR",
    deadline: "2026-07-31",
    eligibility: "Women research students specializing in neurology or cognitive sciences in India",
    category: "Science",
    applicationUrl: "https://www.tatatrusts.org",
    description: "Encouraging female academic research into cognitive medical sciences and neuro-diagnostics.",
    isActive: true
  }
];

export const MOCK_MENTORS: Mentor[] = [
  {
    id: 1,
    name: "Dr. Ananya Rao",
    title: "Senior Research Scientist",
    organization: "Google Research",
    specializations: ["Machine Learning", "AI Ethics", "Computer Vision"],
    bio: "Ananya has 12 years of experience in artificial intelligence and computer vision. She is passionate about mentoring women transition from academia to industry roles in tech.",
    yearsExperience: 12,
    rating: 4.9,
    totalSessions: 140,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 2,
    name: "Priya Sharma",
    title: "VP of Engineering",
    organization: "FinTech Innovations",
    specializations: ["Software Architecture", "Engineering Management", "Backend Systems"],
    bio: "Priya leads a team of 50+ engineers. She specializes in scaling distributed database systems and helps early-to-mid career engineers navigate leadership paths.",
    yearsExperience: 15,
    rating: 4.8,
    totalSessions: 210,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 3,
    name: "Dr. Sunita Krishnan",
    title: "Professor of Biotechnology",
    organization: "Indian Institute of Science",
    specializations: ["Bioinformatics", "Genetic Engineering", "Academic Research"],
    bio: "Sunita has published over 40 research papers in bioinformatics and gene editing. She guides students seeking research internships and PhD applications abroad.",
    yearsExperience: 18,
    rating: 5.0,
    totalSessions: 85,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 4,
    name: "Meera Patel",
    title: "Lead Data Scientist",
    organization: "HealthAI Diagnostics",
    specializations: ["Data Analytics", "Python", "Medical Imaging"],
    bio: "Meera transitioned from a physics background to data science. She has helped multiple career switchers build strong portfolios and crack data science interviews.",
    yearsExperience: 8,
    rating: 4.7,
    totalSessions: 95,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 5,
    name: "Nisha Varghese",
    title: "Lead Mechanical Engineer",
    organization: "AeroTech Dynamics",
    specializations: ["Aerodynamics", "3D Printing", "Product Design"],
    bio: "Nisha is a hardware enthusiast with expertise in aerospace structures. She guides mechanical and civil engineers exploring manufacturing and robotic careers.",
    yearsExperience: 10,
    rating: 4.9,
    totalSessions: 60,
    availability: "limited",
    photoUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 6,
    name: "Dr. Farah Khan",
    title: "Principal Chemist",
    organization: "National Chemical Labs",
    specializations: ["Organic Synthesis", "Industrial Chemistry", "Patents"],
    bio: "Farah helps chemistry and chemical engineering graduates transition from academic research into pharma/chemical R&D labs and startup consulting.",
    yearsExperience: 14,
    rating: 4.8,
    totalSessions: 110,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 7,
    name: "Radhika Iyer",
    title: "Director of Product Management",
    organization: "SaaS Systems Ltd",
    specializations: ["Product Strategy", "UX Design", "Customer Development"],
    bio: "Radhika helps tech engineers pivot into product roles. She teaches user empathy, wireframing, and stakeholder alignment for fast-growing SaaS startups.",
    yearsExperience: 11,
    rating: 4.6,
    totalSessions: 75,
    availability: "available",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 8,
    name: "Aarti Banerjee",
    title: "Chief Information Security Officer",
    organization: "SecureBank India",
    specializations: ["Cybersecurity", "Network Architecture", "Ethical Hacking"],
    bio: "Aarti has spent a decade protecting critical financial infrastructure. She mentors women in network security, pen-testing, and compliance certifications.",
    yearsExperience: 16,
    rating: 5.0,
    totalSessions: 180,
    availability: "limited",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
  }
];

export const MOCK_LEARNING_MODULES: LearningModule[] = [
  {
    id: 1,
    title: "Introduction to STEM Careers",
    description: "Learn about the diverse landscape of STEM careers, find your niche, and map out your career path.",
    category: "Career Guidance",
    durationMinutes: 30,
    difficulty: "beginner",
    tags: ["STEM", "Career Planning", "Growth"],
    content: `# STEM Careers Overview

Welcome to your STEM career path! Discover the vast domains of Science, Technology, Engineering, and Math. Empower yourself with skills and find role models to guide your transition.

## Key STEM Disciplines
- **Computing & IT**: Software engineering, AI, cybersecurity, and data analysis.
- **Engineering**: Mechanical, civil, electrical, aerospace, and biomedical.
- **Natural Sciences**: Biotechnology, chemistry, physics, and life sciences.
- **Mathematics**: Actuarial science, statistics, cryptography, and quantitative analysis.

## Designing Your Roadmap
1. Identify your core strengths and technical interests.
2. Build practical projects to validate your skills.
3. Network with female professionals in your target field.
4. Partner with a mentor to establish specific milestones.`,
    quizQuestions: [
      {
        question: "What is a core benefit of having a mentor in STEM?",
        options: [
          "Mentors do your work for you",
          "Mentors provide guidance, share experiences, and help navigate career challenges",
          "Mentors guarantee a salary promotion within 3 months",
          "Mentors make decisions on your behalf"
        ],
        correctIndex: 1,
        explanation: "Mentorship is about guidance, skill-building, and expanding your professional network."
      },
      {
        question: "Which of the following is the most active way to build credibility in STEM?",
        options: [
          "Only reading textbook theory",
          "Telling people you are good at coding",
          "Building open-source projects or contributing to real-world code repositories",
          "Waiting for opportunities to find you"
        ],
        correctIndex: 2,
        explanation: "Practical application and open-source contributions demonstrate real-world skills to potential employers."
      }
    ]
  },
  {
    id: 2,
    title: "Financial Literacy & Planning",
    description: "Understand the basics of budgeting, personal savings, taxes, and investment instruments in India.",
    category: "Finance",
    durationMinutes: 45,
    difficulty: "intermediate",
    tags: ["Finance", "SIP", "Taxes"],
    content: `# Personal Finance 101

Taking charge of your financial future is key to empowerment. Learn about Systematic Investment Plans (SIPs), tax saving under Section 80C, and building an emergency fund.

## Key Investment Avenues in India:
- **PPF (Public Provident Fund)**: Safe, government-backed, long-term tax-free savings.
- **ELSS (Equity Linked Savings Scheme)**: Tax-saving mutual funds with a 3-year lock-in period.
- **NPS (National Pension System)**: Long-term retirement savings scheme with additional tax benefits.
- **SIP (Systematic Investment Plan)**: Investing small fixed amounts regularly in mutual funds.

## Budgeting Strategy
Adopt the **50/30/20 rule**:
- **50% Needs**: rent, bills, groceries, loan repayments.
- **30% Wants**: shopping, dining out, hobbies, vacations.
- **20% Savings**: emergency fund, investments.`,
    quizQuestions: [
      {
        question: "What does SIP stand for in personal finance?",
        options: [
          "Systematic Investment Plan",
          "Savings Interest Program",
          "Secured Income Portfolio",
          "State Investment Policy"
        ],
        correctIndex: 0,
        explanation: "SIP stands for Systematic Investment Plan, which allows you to invest a fixed amount regularly in mutual funds."
      },
      {
        question: "Under the 50/30/20 budgeting rule, what percentage should go to Savings?",
        options: [
          "50%",
          "30%",
          "20%",
          "10%"
        ],
        correctIndex: 2,
        explanation: "The rule recommends dedicating 50% to needs, 30% to wants, and 20% to savings/investments."
      }
    ]
  },
  {
    id: 3,
    title: "Acing the Technical Interview",
    description: "Essential strategies for algorithms, structural coding reviews, and behavioral STAR interviews.",
    category: "Career Guidance",
    durationMinutes: 40,
    difficulty: "advanced",
    tags: ["Interviews", "STAR Method", "Coding"],
    content: `# Technical Interview Masterclass

Prepare for coding questions, system architecture diagrams, and behavioral interviews.

## The STAR Method for Behavioral Questions
- **Situation**: Describe the background context.
- **Task**: Explain the challenge or problem.
- **Action**: Outline the steps you personally took.
- **Result**: Highlight quantifiable outcomes and what you learned.`,
    quizQuestions: [
      {
        question: "What does the 'A' in STAR interview format stand for?",
        options: [
          "Alternative",
          "Achievement",
          "Action",
          "Analysis"
        ],
        correctIndex: 2,
        explanation: "STAR stands for Situation, Task, Action, and Result."
      }
    ]
  },
  {
    id: 4,
    title: "Cloud Computing & AWS Foundations",
    description: "An introduction to cloud services, virtualization, serverless compute, and AWS console tools.",
    category: "Technology",
    durationMinutes: 35,
    difficulty: "beginner",
    tags: ["Cloud", "AWS", "DevOps"],
    content: `# Cloud Infrastructure Overview

Cloud computing has revolutionized digital engineering. Learn about EC2 instances, S3 storage buckets, and AWS Serverless Lambdas.`,
    quizQuestions: [
      {
        question: "Which AWS service is commonly used for secure, scalable object storage?",
        options: [
          "Amazon EC2",
          "Amazon RDS",
          "Amazon S3",
          "AWS Lambda"
        ],
        correctIndex: 2,
        explanation: "Amazon Simple Storage Service (S3) provides highly durable object storage for images, backups, and datasets."
      }
    ]
  },
  {
    id: 5,
    title: "Data Analytics with Python",
    description: "Learn to process, analyze, and visualize complex datasets using Pandas, Numpy, and Matplotlib.",
    category: "Technology",
    durationMinutes: 50,
    difficulty: "intermediate",
    tags: ["Python", "Data Science", "Pandas"],
    content: `# Python Data Pipelines

Analyze real-world scientific datasets. Learn about DataFrame structures, data cleaning, and plotting trends.`,
    quizQuestions: [
      {
        question: "Which Python library is primary used for data tables and DataFrame operations?",
        options: [
          "Matplotlib",
          "Pandas",
          "Numpy",
          "PyTorch"
        ],
        correctIndex: 1,
        explanation: "Pandas provides extensive tools for structuring data into tabular sheets (DataFrames)."
      }
    ]
  },
  {
    id: 6,
    title: "Biotech & Bio-informatics Foundations",
    description: "Explore the intersection of computer engineering and biology, including gene alignment and protein models.",
    category: "Science",
    durationMinutes: 40,
    difficulty: "intermediate",
    tags: ["Biotech", "Genetics", "Bioinformatics"],
    content: `# Computational Biology

Biotechnology leverages algorithms to decode genetic sequences. Learn about sequence alignment (BLAST) and protein folding models.`,
    quizQuestions: [
      {
        question: "What is bioinformatics primarily about?",
        options: [
          "Plant cataloging in fields",
          "Using software tools and database systems to analyze biological data",
          "Manufacturing chemical medicines",
          "Studying animal behaviors"
        ],
        correctIndex: 1,
        explanation: "Bioinformatics is an interdisciplinary field using computer software algorithms to model and decode biological and genetic information."
      }
    ]
  }
];

// Helper to calculate confidence score client-side
export function calculateConfidenceScore(
  completedModulesCount: number,
  quizzesPassed: number,
  mentorSessions: number,
  aiSessions: number,
  profileCompleteness: number
): {
  score: number;
  level: string;
  breakdown: { learning: number; mentoring: number; aiEngagement: number; profileCompleteness: number };
} {
  const learning = Math.min(100, (completedModulesCount * 10) + (quizzesPassed * 5));
  const mentoring = Math.min(100, mentorSessions * 20);
  const aiEngagement = Math.min(100, aiSessions * 8);
  const profile = Math.min(100, profileCompleteness);

  const score = Math.round(
    learning * 0.35 + mentoring * 0.25 + aiEngagement * 0.20 + profile * 0.20
  );

  let level = "Beginner";
  if (score >= 80) level = "Expert";
  else if (score >= 60) level = "Advanced";
  else if (score >= 40) level = "Intermediate";
  else if (score >= 20) level = "Developing";

  return {
    score,
    level,
    breakdown: { learning, mentoring, aiEngagement, profileCompleteness: profile },
  };
}

// ============================================================================
// FIRESTORE HELPER FUNCTIONS
// ============================================================================

async function fetchUserQuizResults(userId: string): Promise<QuizResult[]> {
  try {
    const q = query(
      collection(db, "quiz_results"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items: QuizResult[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        userId: data.userId,
        moduleId: data.moduleId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage,
        passed: data.passed,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });
    return items;
  } catch (e) {
    console.error("Firestore read error on quiz_results:", e);
    return [];
  }
}

async function fetchUserMentorRequests(userId: string): Promise<MentorRequest[]> {
  try {
    const q = query(
      collection(db, "mentor_requests"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items: MentorRequest[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        userId: data.userId,
        mentorId: data.mentorId,
        message: data.message,
        preferredDate: data.preferredDate,
        status: data.status,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });
    return items;
  } catch (e) {
    console.error("Firestore read error on mentor_requests:", e);
    return [];
  }
}

async function fetchUserConversationsCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (e) {
    console.error("Firestore read error on conversations:", e);
    return 0;
  }
}

async function logActivity(userId: string, type: string, description: string, metadata: any = {}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userId,
      type,
      description,
      metadata,
      createdAt: Timestamp.now()
    });
  } catch (e) {
    console.error("Firestore write error on activity_logs:", e);
  }
}

// ============================================================================
// REACT QUERY HOOKS (REPLACING WORKSPACE CLIENT APIS)
// ============================================================================

// 1. Scholarships List
export function useListScholarships(params?: ListScholarshipsParams, options?: any) {
  return useQuery<ScholarshipList>({
    ...options,
    queryKey: ["scholarships", params],
    queryFn: async () => {
      let items = [...MOCK_SCHOLARSHIPS];
      
      if (params?.category) {
        items = items.filter(s => s.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params?.search) {
        const term = params.search.toLowerCase();
        items = items.filter(s => s.title.toLowerCase().includes(term) || s.provider.toLowerCase().includes(term));
      }
      
      const limitVal = params?.limit || 10;
      const offsetVal = params?.offset || 0;
      const paginated = items.slice(offsetVal, offsetVal + limitVal);
      
      return {
        items: paginated,
        total: items.length
      };
    }
  });
}

// 2. AI Scholarship recommendations
export function useGenerateScholarshipRecommendations() {
  return useMutation<AiResponse, Error, { data: ScholarshipRecoInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      if (!client) {
        return { content: `AI recommendations for profile: "${data.profile}".\n\n- Government INSPIRE Fellowship\n- Google APAC Scholarship\n- Biocon Biotech Fund` };
      }
      
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SCHOLARSHIP_SYSTEM,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      });
      
      const prompt = `Find scholarship and scheme recommendations for:
Profile: ${data.profile}
Field of Study: ${data.fieldOfStudy || "STEM"}
Career Stage: ${data.careerStage || "student/early career"}`;
      
      const result = await model.generateContent(prompt);
      return { content: result.response.text() };
    }
  });
}

// 3. AI Resume Analyzer
export function useGenerateResumeFeedback() {
  return useMutation<ResumeAnalysis, Error, { data: ResumeFeedbackInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      const defaultResponse: ResumeAnalysis = {
        score: 75,
        strengths: ["Strong academic records", "Technical layout is clean"],
        weaknesses: ["Add more quantitative details of projects", "Quantify metrics"],
        improvements: ["State how database optimizations saved speed/time", "Add metric points"],
        summary: "Your resume is structural, but it needs quantitative values to demonstrate full engineering impact."
      };

      if (!client) return defaultResponse;
      
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: RESUME_SYSTEM,
        generationConfig: { ...GENERATION_CONFIG, temperature: 0.3 },
        safetySettings: SAFETY_SETTINGS,
      });
      
      const prompt = data.targetRole
        ? `Analyze this resume for a ${data.targetRole} position:\n\n${data.resumeText}`
        : `Analyze this resume:\n\n${data.resumeText}`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON structure in AI response");
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("AI returned invalid JSON:", text);
        return {
          ...defaultResponse,
          summary: text
        };
      }
    }
  });
}

// 4. Dashboard Summary hook (fetches aggregates from Firestore)
export function useGetDashboardSummary(userId: string, options?: any) {
  return useQuery<DashboardSummary>({
    ...options,
    queryKey: ["dashboard-summary", userId],
    queryFn: async () => {
      if (!userId) {
        return {
          userId: "",
          careerConfidenceScore: 0,
          completedModules: 0,
          totalModules: MOCK_LEARNING_MODULES.length,
          activeMentorRequests: 0,
          aiSessionsCount: 0,
          scholarshipsBookmarked: 0,
          upcomingDeadlines: [],
          weeklyGoalProgress: 0,
        };
      }
      const [quizResults, mentorRequests, conversationsCount] = await Promise.all([
        fetchUserQuizResults(userId),
        fetchUserMentorRequests(userId),
        fetchUserConversationsCount(userId)
      ]);
      
      const completedModuleIds = new Set(quizResults.filter(r => r.passed).map(r => r.moduleId));
      const completedModules = completedModuleIds.size;
      const activeMentorRequests = mentorRequests.filter(r => r.status === "pending" || r.status === "accepted").length;
      
      // Calculate confidence score using aggregates
      const { score } = calculateConfidenceScore(
        completedModules,
        quizResults.filter(r => r.passed).length,
        mentorRequests.filter(r => r.status === "completed").length,
        conversationsCount,
        60 // Default profile completeness
      );
      
      const upcomingScholarships = MOCK_SCHOLARSHIPS.slice(0, 3);
      const upcomingDeadlines = upcomingScholarships
        .filter(s => s.deadline)
        .map(s => ({ title: s.title, deadline: s.deadline!, type: "scholarship" as const }));
        
      const weeklyGoalProgress = Math.min(100, Math.round((completedModules / 2) * 100));
      
      return {
        userId,
        careerConfidenceScore: score,
        completedModules,
        totalModules: MOCK_LEARNING_MODULES.length,
        activeMentorRequests,
        aiSessionsCount: conversationsCount,
        scholarshipsBookmarked: 10,
        upcomingDeadlines,
        weeklyGoalProgress
      };
    },
    enabled: !!userId
  });
}

// 5. Mentors List
export function useListMentors(params?: ListMentorsParams, options?: any) {
  return useQuery<MentorList>({
    ...options,
    queryKey: ["mentors", params],
    queryFn: async () => {
      let items = [...MOCK_MENTORS];
      
      if (params?.specialization) {
        const spec = params.specialization.toLowerCase();
        items = items.filter(m => m.specializations.some(s => s.toLowerCase().includes(spec)));
      }
      if (params?.search) {
        const term = params.search.toLowerCase();
        items = items.filter(m => m.name.toLowerCase().includes(term) || m.organization.toLowerCase().includes(term) || m.title.toLowerCase().includes(term));
      }
      
      return {
        items,
        total: items.length
      };
    }
  });
}

// 6. Mentor Requests
export function useGetMentorRequests(userId: string, options?: any) {
  return useQuery<MentorRequestList>({
    ...options,
    queryKey: ["mentor-requests", userId],
    queryFn: async () => {
      const items = await fetchUserMentorRequests(userId);
      return {
        items,
        total: items.length
      };
    },
    enabled: !!userId
  });
}

// 7. Submit Mentor Request
export function useCreateMentorRequest() {
  const queryClient = useQueryClient();
  return useMutation<MentorRequest, Error, { data: MentorRequestInput }>({
    mutationFn: async ({ data }) => {
      const docData = {
        userId: data.userId,
        mentorId: data.mentorId,
        message: data.message,
        preferredDate: data.preferredDate || null,
        status: "pending",
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "mentor_requests"), docData);
      
      const mentor = MOCK_MENTORS.find(m => m.id === data.mentorId);
      const mentorName = mentor ? mentor.name : `Mentor #${data.mentorId}`;
      await logActivity(data.userId, "mentor_request", `Requested a session with ${mentorName}`);
      
      return {
        id: docRef.id,
        userId: docData.userId,
        mentorId: docData.mentorId,
        message: docData.message,
        preferredDate: docData.preferredDate,
        status: "pending" as const,
        createdAt: new Date().toISOString()
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mentor-requests", variables.data.userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", variables.data.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", variables.data.userId] });
    }
  });
}

// 8. Learning Modules List
export function useListLearningModules(params?: ListLearningModulesParams, options?: any) {
  return useQuery<LearningModuleList>({
    ...options,
    queryKey: ["learning-modules", params],
    queryFn: async () => {
      let items = [...MOCK_LEARNING_MODULES];
      
      if (params?.category) {
        items = items.filter(m => m.category.toLowerCase() === params.category!.toLowerCase());
      }
      
      return {
        items,
        total: items.length
      };
    }
  });
}

// 9. Save Quiz Completion Result
export function useSaveQuizResult() {
  const queryClient = useQueryClient();
  return useMutation<QuizResult, Error, { data: QuizResultInput }>({
    mutationFn: async ({ data }) => {
      const percentage = Math.round((data.score / data.totalQuestions) * 100);
      const passed = percentage >= 70; // 70% passing threshold
      
      const docData = {
        userId: data.userId,
        moduleId: data.moduleId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage,
        passed,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "quiz_results"), docData);
      
      const moduleItem = MOCK_LEARNING_MODULES.find(m => m.id === data.moduleId);
      const moduleTitle = moduleItem ? moduleItem.title : `Module #${data.moduleId}`;
      
      await logActivity(
        data.userId, 
        "quiz_completed", 
        `Completed quiz for "${moduleTitle}" with ${percentage}%`, 
        { score: data.score, moduleName: moduleTitle }
      );
      
      if (passed) {
        await logActivity(data.userId, "module_completed", `Completed learning module "${moduleTitle}"`);
      }
      
      return {
        id: docRef.id,
        userId: docData.userId,
        moduleId: docData.moduleId,
        score: docData.score,
        totalQuestions: docData.totalQuestions,
        percentage,
        passed,
        createdAt: new Date().toISOString()
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", variables.data.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", variables.data.userId] });
    }
  });
}

// 10. User Activity Feed
export function useListUserActivity(userId: string, options?: any) {
  return useQuery<ActivityFeed>({
    ...options,
    queryKey: ["user-activity", userId],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, "activity_logs"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        const items: ActivityItem[] = [];
        
        snap.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            type: data.type,
            description: data.description,
            timestamp: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            metadata: data.metadata || {}
          });
        });
        
        return {
          items,
          total: items.length
        };
      } catch (e) {
        console.error("Firestore read error on activity_logs:", e);
        return { items: [], total: 0 };
      }
    },
    enabled: !!userId
  });
}

// 11. AI Career advice chatbot
export function useGenerateCareerAdvice() {
  return useMutation<AiResponse, Error, { data: CareerAdviceInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      if (!client) {
        return { content: "I'm your career mentor. (Gemini API key is not set; running in local preview mode)." };
      }
      
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: CAREER_MENTOR_SYSTEM,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      });
      
      let chatHistory = (data.history || []).map(msg => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }],
      }));

      // The Gemini API requires the first message in startChat history to be from the user.
      // If the history starts with a model greeting, we slice it out.
      if (chatHistory.length > 0 && chatHistory[0].role === "model") {
        chatHistory = chatHistory.slice(1);
      }
      
      const contextPrefix = data.careerStage
        ? `[Context: Career stage: ${data.careerStage}, Persona: ${data.persona || "not specified"}]\n\n`
        : "";
        
      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(contextPrefix + data.message);
      return { content: result.response.text() };
    }
  });
}

// 12. Save AI Conversation chat session
export function useSaveConversation() {
  const queryClient = useQueryClient();
  return useMutation<Conversation, Error, { data: ConversationInput }>({
    mutationFn: async ({ data }) => {
      const docData = {
        userId: data.userId,
        title: data.title || "Career Mentoring Session",
        messages: data.messages,
        type: data.type,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "conversations"), docData);
      await logActivity(data.userId, "ai_chat", `Started a mentoring session: "${docData.title}"`);
      
      return {
        id: docRef.id,
        userId: docData.userId,
        title: docData.title,
        messages: docData.messages,
        type: docData.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", variables.data.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", variables.data.userId] });
    }
  });
}

// Additional prompts (Financial explanation, interview generator, learning path)

export function useGenerateFinancialLiteracy() {
  return useMutation<AiResponse, Error, { data: FinancialLiteracyInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      if (!client) {
        return { content: `Explanation of financial concept: "${data.topic}". (Gemini API key not configured).` };
      }
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: FINANCIAL_SYSTEM,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      });
      const prompt = `Explain "${data.topic}" for a ${data.level || "beginner"} audience. Include practical examples relevant to working women in India.`;
      const result = await model.generateContent(prompt);
      return { content: result.response.text() };
    }
  });
}

export function useGenerateInterviewQuestions() {
  return useMutation<AiResponse, Error, { data: InterviewQuestionsInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      if (!client) {
        return { content: `Mock Interview Questions for: "${data.role}" (${data.level}). (Gemini API key not configured).` };
      }
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are an expert technical interviewer and career coach for STEM roles. Generate realistic, high-quality interview questions. Respond in Markdown.`,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      });
      const prompt = `Generate 10 interview questions for a ${data.level || "mid-level"} ${data.role} position. Include behavioral and technical questions with tips.`;
      const result = await model.generateContent(prompt);
      return { content: result.response.text() };
    }
  });
}

export function useGenerateLearningPlan() {
  return useMutation<AiResponse, Error, { data: LearningPlanInput }>({
    mutationFn: async ({ data }) => {
      const client = getGeminiClient();
      if (!client) {
        return { content: `Customized Learning Roadmaps. Goals: ${data.goals.join(", ")}. (Gemini API key not configured).` };
      }
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are an expert learning design specialist and career development coach for STEM professionals. Create weekly plans. Respond in Markdown.`,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      });
      const prompt = `Create a personalized learning plan.
Goals: ${data.goals.join(", ")}
Current skills: ${data.currentSkills.join(", ")}
Timeframe: ${data.timeframe || "3 months"}`;
      const result = await model.generateContent(prompt);
      return { content: result.response.text() };
    }
  });
}
