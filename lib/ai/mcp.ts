/**
 * Model Context Protocol (MCP) - Tool Discovery Layer
 * Defines available tools and routes execution to Composio or RAG
 */

import { executeComposioTool } from "./composio";
import { searchEmailsSemantic } from "./rag";

export interface MCPTool {
  name: string;
  description: string;
  app: string; // "gmail", "googlecalendar", "internal" (for RAG)
  composioAction: string | null; // null for internal tools
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Manifest - Tool Registry
 * Add new tools here to make them discoverable by the agent
 */
export const MCP_MANIFEST: MCPTool[] = [
  // Gmail Tools
  {
    name: "fetch_gmail_emails",
    description: "Fetch emails from Gmail inbox with filters",
    app: "gmail",
    composioAction: "GMAIL_FETCH_EMAILS",
    parameters: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum number of emails to fetch (default: 10)",
        },
        query: {
          type: "string",
          description: "Gmail search query (e.g., 'is:unread from:professor')",
        },
      },
      required: [],
    },
  },
  {
    name: "send_gmail",
    description: "Send an email via Gmail",
    app: "gmail",
    composioAction: "GMAIL_SEND_EMAIL",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body content" },
      },
      required: ["to", "subject", "body"],
    },
  },

  // Google Calendar Tools
  {
    name: "add_calendar_event",
    description: "Create a new event in Google Calendar",
    app: "googlecalendar",
    composioAction: "GOOGLECALENDAR_CREATE_EVENT",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Event title" },
        description: { type: "string", description: "Event description" },
        start: {
          type: "string",
          description: "Start time (ISO 8601 format)",
        },
        end: { type: "string", description: "End time (ISO 8601 format)" },
        location: { type: "string", description: "Event location" },
      },
      required: ["summary", "start", "end"],
    },
  },
  {
    name: "list_calendar_events",
    description: "List upcoming events from Google Calendar",
    app: "googlecalendar",
    composioAction: "GOOGLECALENDAR_LIST_EVENTS",
    parameters: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum events to return",
        },
        timeMin: {
          type: "string",
          description: "Start time filter (ISO 8601)",
        },
      },
      required: [],
    },
  },

  // Google Classroom Tools
  {
    name: "list_classroom_assignments",
    description: "List assignments from Google Classroom courses",
    app: "googleclassroom",
    composioAction: "GOOGLECLASSROOM_LIST_COURSEWORK",
    parameters: {
      type: "object",
      properties: {
        courseId: {
          type: "string",
          description: "Course ID (optional, lists all if not provided)",
        },
      },
      required: [],
    },
  },
  {
    name: "list_classroom_courses",
    description: "List all enrolled Google Classroom courses",
    app: "googleclassroom",
    composioAction: "GOOGLECLASSROOM_LIST_COURSES",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  // Google Drive Tools
  {
    name: "search_drive_files",
    description: "Search files in Google Drive",
    app: "googledrive",
    composioAction: "GOOGLEDRIVE_LIST_FILES",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxResults: { type: "number", description: "Max results" },
      },
      required: [],
    },
  },

  // Internal Tools (RAG)
  {
    name: "search_gmail_semantic",
    description:
      "Semantically search emails using RAG (better than keyword search)",
    app: "internal",
    composioAction: null,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language search query",
        },
        topK: {
          type: "number",
          description: "Number of results to return (default: 5)",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Get MCP manifest (all available tools)
 */
export function getMCPManifest(): MCPTool[] {
  return MCP_MANIFEST;
}

/**
 * Find a tool by name
 */
export function getTool(toolName: string): MCPTool | null {
  return MCP_MANIFEST.find((t) => t.name === toolName) || null;
}

/**
 * Execute MCP tool - routes to Composio or internal handler (RAG)
 */
export async function executeMCPTool(
  userId: string,
  toolName: string,
  params: any
) {
  const tool = getTool(toolName);

  if (!tool) {
    return {
      success: false,
      error: `Tool '${toolName}' not found in MCP manifest`,
      data: null,
    };
  }

  // Handle internal tools (RAG)
  if (tool.app === "internal") {
    return executeInternalTool(userId, toolName, params);
  }

  // Handle Composio tools
  if (!tool.composioAction) {
    return {
      success: false,
      error: `Tool '${toolName}' has no Composio action defined`,
      data: null,
    };
  }

  return executeComposioTool({
    userId,
    toolName: tool.composioAction,
    parameters: params,
  });
}

/**
 * Execute internal tools (non-Composio)
 * Currently: RAG semantic search
 */
async function executeInternalTool(
  userId: string,
  toolName: string,
  params: any
) {
  try {
    switch (toolName) {
      case "search_gmail_semantic":
        const results = await searchEmailsSemantic(
          userId,
          params.query,
          params.topK || 5
        );
        return {
          success: true,
          data: results,
          error: null,
        };

      default:
        return {
          success: false,
          error: `Internal tool '${toolName}' not implemented`,
          data: null,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Get tools as Gemini function declarations
 * For Gemini function calling
 */
export function getToolsForGemini(): any[] {
  return MCP_MANIFEST.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
