/**
 * RAG Testing Endpoints
 * For syncing and searching emails semantically
 */

import { NextRequest } from "next/server";
import {
  syncGmailToRAG,
  searchEmailsSemantic,
  getRAGStats,
} from "@/lib/ai/rag";

/**
 * POST /api/rag
 * Handles sync and search operations based on action parameter
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, maxEmails, query, topK } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Route based on action
    switch (action) {
      case "sync":
        return handleSync(userId, maxEmails);

      case "search":
        return handleSearch(userId, query, topK);

      case "stats":
        return handleStats(userId);

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action. Use 'sync', 'search', or 'stats'",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("RAG API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle sync action
 */
async function handleSync(userId: string, maxEmails: number = 50) {
  console.log(`[RAG Sync] Starting for user ${userId}, max emails: ${maxEmails}`);

  const result = await syncGmailToRAG(userId, maxEmails);

  if (result.success) {
    return new Response(
      JSON.stringify({
        success: true,
        synced: result.synced,
        message: `Successfully synced ${result.synced} emails to RAG index`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: result.error || "Sync failed",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Handle search action
 */
async function handleSearch(
  userId: string,
  query: string,
  topK: number = 5
) {
  if (!query) {
    return new Response(
      JSON.stringify({ error: "query parameter is required for search" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`[RAG Search] User ${userId}, query: "${query}", topK: ${topK}`);

  const results = await searchEmailsSemantic(userId, query, topK);

  return new Response(
    JSON.stringify({
      success: true,
      query,
      count: results.length,
      results: results.map((r) => ({
        emailId: r.emailId,
        subject: r.subject,
        from: r.from,
        snippet: r.snippet,
        similarity: parseFloat(r.similarity.toFixed(3)),
      })),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Handle stats action
 */
async function handleStats(userId: string) {
  console.log(`[RAG Stats] Fetching for user ${userId}`);

  const stats = await getRAGStats(userId);

  return new Response(
    JSON.stringify({
      success: true,
      userId,
      stats,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * GET /api/rag
 * Health check and usage info
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "RAG API is running",
      usage: {
        sync: "POST /api/rag with { action: 'sync', userId, maxEmails }",
        search: "POST /api/rag with { action: 'search', userId, query, topK }",
        stats: "POST /api/rag with { action: 'stats', userId }",
      },
      examples: {
        sync: {
          action: "sync",
          userId: "your_firebase_uid",
          maxEmails: 50,
        },
        search: {
          action: "search",
          userId: "your_firebase_uid",
          query: "emails about machine learning",
          topK: 5,
        },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
