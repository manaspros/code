/**
 * AI Agent Orchestrator
 * Combines Gemini + MCP + RAG for intelligent task execution
 */

import { generateWithTools, chat } from "./gemini";
import { getToolsForGemini, executeMCPTool } from "./mcp";
import { searchEmailsSemantic } from "./rag";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  text: string;
  toolCalls?: Array<{
    tool: string;
    params: any;
    result: any;
  }>;
  ragUsed?: boolean;
}

/**
 * Main agent entry point
 * Processes user messages and executes tools as needed
 */
export async function runAgent({
  userId,
  messages,
}: {
  userId: string;
  messages: ChatMessage[];
}): Promise<AgentResponse> {
  try {
    // Get latest user message
    const userMessage = messages[messages.length - 1].content;

    // Step 1: Detect intent with Gemini + tools
    const tools = getToolsForGemini();
    const geminiResponse = await generateWithTools(
      buildPromptWithContext(messages),
      tools
    );

    // Step 2: Check if tool was called
    if (geminiResponse.functionCall) {
      const { name, args } = geminiResponse.functionCall;

      // Execute tool via MCP
      const toolResult = await executeMCPTool(userId, name, args);

      // Step 3: Generate response with tool result
      const responseText = await chat([
        ...messages,
        {
          role: "assistant",
          content: `I executed ${name} and got: ${JSON.stringify(
            toolResult.data
          )}`,
        },
        {
          role: "user",
          content: "Summarize the results in a natural way",
        },
      ]);

      return {
        text: responseText,
        toolCalls: [
          {
            tool: name,
            params: args,
            result: toolResult,
          },
        ],
      };
    }

    // Step 4: No tool needed - check if RAG search would help
    if (shouldUseRAG(userMessage)) {
      const ragResults = await searchEmailsSemantic(userId, userMessage, 3);

      if (ragResults.length > 0) {
        const ragContext = ragResults
          .map(
            (r) =>
              `Email from ${r.from}: ${r.subject}\n${r.snippet} (similarity: ${r.similarity.toFixed(2)})`
          )
          .join("\n\n");

        const responseWithRAG = await chat([
          ...messages,
          {
            role: "system",
            content: `Context from user's emails:\n${ragContext}`,
          },
        ]);

        return {
          text: responseWithRAG,
          ragUsed: true,
        };
      }
    }

    // Step 5: Simple chat response (no tools, no RAG)
    const simpleResponse = await chat(messages);

    return {
      text: simpleResponse,
    };
  } catch (error: any) {
    console.error("Agent error:", error);
    return {
      text: `Sorry, I encountered an error: ${error.message}`,
    };
  }
}

/**
 * Process single turn (simplified version)
 */
export async function processTurn(
  userId: string,
  userMessage: string
): Promise<string> {
  const response = await runAgent({
    userId,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.text;
}

/**
 * Build prompt with conversation context
 */
function buildPromptWithContext(messages: ChatMessage[]): string {
  const systemPrompt = `You are an AI assistant helping students manage their academic inbox.
You have access to Gmail, Google Calendar, Google Classroom, and Google Drive.

Your capabilities:
- Fetch and search emails
- Create calendar events
- List assignments
- Search files in Drive
- Semantic email search using RAG

When the user asks to perform an action, use the appropriate tool.
Be helpful, concise, and action-oriented.`;

  const conversationText = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `${systemPrompt}\n\nConversation:\n${conversationText}`;
}

/**
 * Heuristic to determine if RAG would be helpful
 * MVP: Simple keyword matching
 */
function shouldUseRAG(message: string): boolean {
  const ragKeywords = [
    "find",
    "search",
    "show me",
    "look for",
    "emails about",
    "mentioned",
    "discussed",
    "related to",
  ];

  const lowerMessage = message.toLowerCase();
  return ragKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Stream agent response (for real-time chat)
 * MVP: Simplified - full implementation would use streaming
 */
export async function* streamAgent({
  userId,
  messages,
}: {
  userId: string;
  messages: ChatMessage[];
}) {
  // For MVP, just yield the full response
  // Full streaming would require Gemini streaming + incremental tool execution
  const response = await runAgent({ userId, messages });

  // Simulate streaming by yielding chunks
  const words = response.text.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
