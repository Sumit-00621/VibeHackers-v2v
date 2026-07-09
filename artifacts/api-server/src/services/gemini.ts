import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { logger } from "../lib/logger.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to Replit Secrets.");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

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

const INTERVIEW_SYSTEM = `You are an expert technical interviewer and career coach for STEM roles. Generate realistic, high-quality interview questions that help candidates prepare thoroughly.

Guidelines:
- Include a mix of behavioral (STAR format), technical, and situational questions
- Tailor difficulty to the specified experience level
- Include tips for how to approach each question type
- Respond in Markdown with clear sections`;

const LEARNING_PLAN_SYSTEM = `You are an expert learning design specialist and career development coach for STEM professionals. Create personalized, realistic learning plans.

Guidelines:
- Create structured, time-bound learning paths
- Include specific resources (books, online courses, certifications)
- Break down the plan into weekly milestones
- Account for real-world constraints (time, cost, accessibility)
- Respond in Markdown with a clear timeline structure`;

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

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export async function generateCareerAdvice(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  context?: { careerStage?: string | null; persona?: string | null }
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: CAREER_MENTOR_SYSTEM,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const chatHistory: ChatMessage[] = history.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const contextPrefix = context?.careerStage
    ? `[Context: Career stage: ${context.careerStage}, Persona: ${context.persona || "not specified"}]\n\n`
    : "";

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(contextPrefix + message);
  return result.response.text();
}

export async function analyzeResume(resumeText: string, targetRole?: string | null): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
}> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: RESUME_SYSTEM,
    generationConfig: { ...GENERATION_CONFIG, temperature: 0.3 },
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = targetRole
    ? `Analyze this resume for a ${targetRole} position:\n\n${resumeText}`
    : `Analyze this resume:\n\n${resumeText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error({ err }, "Failed to parse resume analysis JSON");
    return {
      score: 65,
      strengths: ["Resume received and analyzed"],
      weaknesses: ["Unable to parse structured feedback"],
      improvements: ["Please try again with a clearer resume format"],
      summary: text.slice(0, 500),
    };
  }
}

export async function generateInterviewQuestions(role: string, level?: string | null): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: INTERVIEW_SYSTEM,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Generate 10 interview questions for a ${level || "mid-level"} ${role} position. Include behavioral, technical, and situational questions with tips.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateLearningPlan(
  goals: string[],
  currentSkills: string[],
  timeframe?: string | null
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: LEARNING_PLAN_SYSTEM,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Create a personalized learning plan.
Goals: ${goals.join(", ")}
Current skills: ${currentSkills.join(", ")}
Timeframe: ${timeframe || "3 months"}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateScholarshipRecommendations(
  profile: string,
  fieldOfStudy?: string | null,
  careerStage?: string | null
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SCHOLARSHIP_SYSTEM,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Find scholarship and scheme recommendations for:
Profile: ${profile}
Field of Study: ${fieldOfStudy || "STEM"}
Career Stage: ${careerStage || "student/early career"}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateFinancialLiteracy(topic: string, level?: string | null): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: FINANCIAL_SYSTEM,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Explain "${topic}" for a ${level || "beginner"} audience. Include practical examples relevant to working women in India.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export function calculateConfidenceScore(
  completedModules: number,
  quizzesPassed: number,
  mentorSessions: number,
  aiSessions: number,
  profileCompleteness: number
): {
  score: number;
  level: string;
  breakdown: { learning: number; mentoring: number; aiEngagement: number; profileCompleteness: number };
} {
  const learning = Math.min(100, (completedModules * 10) + (quizzesPassed * 5));
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
