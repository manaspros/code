import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * API endpoint to summarize emails using Gemini AI
 */
export async function POST(req: NextRequest) {
  try {
    const { subject, body, from } = await req.json();

    if (!subject && !body) {
      return NextResponse.json(
        { error: "Email subject or body is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are an AI email summarization assistant for college students.

Please provide a concise, helpful summary of the following email:

**Subject:** ${subject}
**From:** ${from}

**Email Body:**
${body}

Provide a summary that includes:
1. **Main Purpose**: What is the email about in 1-2 sentences
2. **Action Items**: Any tasks, deadlines, or actions required (if any)
3. **Important Details**: Key dates, requirements, or information

Keep the summary concise (3-5 sentences max) and focus on what's important for a student.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Error summarizing email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize email" },
      { status: 500 }
    );
  }
}
