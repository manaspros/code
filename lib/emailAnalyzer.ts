import { geminiRateLimiter } from "./rateLimiter";
import { getGeminiModel } from "./gemini";
import { extractEmailMetadata, shouldAnalyzeWithAI } from "./semanticSearch";

/**
 * Analyze email once and extract everything:
 * - Course name
 * - Deadlines
 * - Alerts
 *
 * This reduces 3 API calls to 1!
 */

interface EmailAnalysis {
  course: string | null;
  deadlines: Array<{
    title: string;
    dueAt: string;
    type: "assignment" | "exam" | "submission" | "event";
  }>;
  alert: {
    kind: "cancelled" | "rescheduled" | "urgent" | "room_change";
    subject: string;
    link: string | null;
  } | null;
  usedAI?: boolean; // Track if we actually called AI
}

// OLD HELPER FUNCTIONS - Now using semanticSearch.ts

export async function analyzeEmail(
  subject: string,
  from: string,
  body: string
): Promise<EmailAnalysis> {
  // Use semantic search to decide if we need AI at all
  const analysis = shouldAnalyzeWithAI(subject, from, body);
  const metadata = analysis.metadata;

  // If we don't need AI, return metadata-based result
  if (!analysis.needsAnalysis) {
    return {
      course: metadata.courses[0] || null,
      deadlines: [], // Would need AI to extract specific deadlines
      alert: metadata.alerts.length > 0
        ? {
            kind: metadata.alerts[0].includes('cancel') ? 'cancelled' : 'urgent',
            subject: subject,
            link: null,
          }
        : null,
      usedAI: false, // No AI call made!
    };
  }

  // Make ONE AI call to get everything
  try {
    return await geminiRateLimiter.execute(async () => {
      const model = getGeminiModel();

      const prompt = `Analyze this email and extract ALL of the following in ONE JSON response:

{
  "course": "Course code or name (e.g., CS-101, Math 204) or null if not found",
  "deadlines": [
    {
      "title": "Assignment/exam name",
      "dueAt": "YYYY-MM-DDTHH:mm:ss.000Z (ISO 8601)",
      "type": "assignment" | "exam" | "submission" | "event"
    }
  ],
  "alert": {
    "kind": "cancelled" | "rescheduled" | "urgent" | "room_change",
    "subject": "Brief description",
    "link": null
  } or null if no alert
}

Return ONLY valid JSON. If course/deadlines/alert not found, use null or empty array.

From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 1000)}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Use metadata if AI didn't find course
        if (!parsed.course && metadata.courses[0]) {
          parsed.course = metadata.courses[0];
        }

        parsed.usedAI = true; // Mark that we used AI
        return parsed;
      }

      return {
        course: metadata.courses[0] || null,
        deadlines: [],
        alert: null,
        usedAI: true,
      };
    });
  } catch (error) {
    console.error("Error analyzing email:", error);
    return {
      course: metadata.courses[0] || null,
      deadlines: [],
      alert: null,
      usedAI: false,
    };
  }
}
