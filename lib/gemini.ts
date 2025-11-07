import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiRateLimiter } from "./rateLimiter";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get Gemini model for general use
// Using gemini-2.0-flash-lite for better rate limits (30 RPM, lighter and faster)
export function getGeminiModel(modelName: string = "gemini-2.0-flash-lite") {
  return genAI.getGenerativeModel({ model: modelName });
}

// Legacy functions kept for backward compatibility but NOT USED
// New code uses emailAnalyzer.ts with semantic search

// OLD categorizeEmail function for backward compatibility
export async function categorizeEmailDetailed(emailContent: string, subject: string) {
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

// OLD FUNCTIONS - NOT USED ANYMORE
// New implementation in emailAnalyzer.ts is much more efficient

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
