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

    const prompt = `You are a professional AI email assistant designed for college students. Analyze the following email and provide a clean, well-structured summary.

**Email Details:**
- **Subject:** ${subject}
- **From:** ${from}
- **Content:** ${body}

Generate a professional summary using this EXACT format:

## 📧 Email Summary

### 🎯 Main Purpose
[Provide a clear, concise explanation of the email's primary purpose in 1-2 sentences]

### ✅ Action Items
${body.toLowerCase().includes('action') || body.toLowerCase().includes('deadline') || body.toLowerCase().includes('submit') || body.toLowerCase().includes('check') ?
  '[List specific actions required with bullet points]' :
  '_No immediate action required._'}

### 📌 Key Details
[Highlight the most important information, dates, requirements, or context the student should be aware of]

---

**Guidelines:**
- Use clear, professional language
- Be concise but informative (3-5 sentences total)
- Use bullet points (•) for multiple items
- Use _italics_ for "No action required" or "None"
- Focus on student-relevant information
- Include specific dates/times if mentioned`;

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
