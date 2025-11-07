/**
 * Chat API Endpoint
 * Main interface for AI agent interactions
 */

import { NextRequest } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/ai/agent";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    // Validate inputs
    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    console.log(`[Chat] Processing request for user: ${userId}`);

    // Run agent
    const response = await runAgent({
      userId,
      messages: messages as ChatMessage[],
    });

    // Return response with metadata
    return new Response(
      JSON.stringify({
        text: response.text,
        toolCalls: response.toolCalls || [],
        ragUsed: response.ragUsed || false,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle rate limits
    if (
      error.message?.includes("Quota exceeded") ||
      error.message?.includes("RATE_LIMIT_EXCEEDED")
    ) {
      return new Response(
        JSON.stringify({
          error:
            "API rate limit reached. Please wait a moment and try again.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process chat",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Chat API is running",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
