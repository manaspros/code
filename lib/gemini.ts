import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get Gemini model for general use
export function getGeminiModel(modelName: string = "gemini-2.0-flash-exp") {
  return genAI.getGenerativeModel({ model: modelName });
}

// Categorize email using Gemini
export async function categorizeEmail(emailContent: string, subject: string) {
  const model = getGeminiModel();

  const prompt = `Analyze this email and categorize it. Return ONLY a JSON object with these fields:
{
  "category": "assignment" | "exam" | "schedule_change" | "grade" | "administrative" | "general",
  "priority": "high" | "medium" | "low",
  "hasDeadline": boolean,
  "deadline": "YYYY-MM-DD" or null,
  "courseName": string or null,
  "actionItems": string[]
}

Email Subject: ${subject}
Email Content: ${emailContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Error categorizing email:", error);
    return {
      category: "general",
      priority: "low",
      hasDeadline: false,
      deadline: null,
      courseName: null,
      actionItems: [],
    };
  }
}

// Summarize long email
export async function summarizeEmail(emailContent: string) {
  const model = getGeminiModel();

  const prompt = `Summarize this email in 2-3 concise sentences. Focus on:
1. Main topic/purpose
2. Key action items or deadlines
3. Important details

Email: ${emailContent}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error summarizing email:", error);
    return "Unable to generate summary.";
  }
}

// Extract deadlines from text
export async function extractDeadlines(text: string) {
  const model = getGeminiModel();

  const prompt = `Extract all deadlines, due dates, and important dates from this text. Return ONLY a JSON array:
[
  {
    "title": "Assignment title or event name",
    "date": "YYYY-MM-DD",
    "time": "HH:MM" or null,
    "type": "assignment" | "exam" | "event" | "other"
  }
]

Text: ${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error extracting deadlines:", error);
    return [];
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

export default genAI;
