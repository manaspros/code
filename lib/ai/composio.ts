/**
 * Composio Integration (v3 API)
 * Fast MVP approach - executes tools via Composio for Gmail, Calendar, Drive, Classroom
 */

import { Composio } from "@composio/core";

// Initialize Composio client
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

export interface ComposioToolExecuteParams {
  userId: string;
  toolName: string;
  parameters: Record<string, any>;
}

/**
 * Get or create Composio entity for Firebase user
 * Entity ID = Firebase UID
 */
export async function getComposioEntity(userId: string) {
  try {
    const entities = await composio.entities.list();
    const existing = entities.items.find((e: any) => e.id === userId);

    if (existing) return existing;

    // Create new entity
    return await composio.entities.create({ id: userId });
  } catch (error) {
    console.error("Error getting Composio entity:", error);
    throw error;
  }
}

/**
 * Get active connection for an app (gmail, googlecalendar, googledrive, googleclassroom)
 */
export async function getActiveConnection(userId: string, app: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      entityIds: [userId],
    });

    return connections.items.find(
      (conn: any) =>
        conn.status === "ACTIVE" &&
        (conn.appUniqueId?.toLowerCase().includes(app.toLowerCase()) ||
          conn.toolkit?.slug?.toLowerCase() === app.toLowerCase())
    );
  } catch (error) {
    console.error(`Error getting ${app} connection:`, error);
    return null;
  }
}

/**
 * Execute any Composio tool
 * MVP: Simple execution without complex error handling
 */
export async function executeComposioTool({
  userId,
  toolName,
  parameters,
}: ComposioToolExecuteParams) {
  try {
    const appName = getAppFromToolName(toolName);
    const connection = await getActiveConnection(userId, appName);

    if (!connection) {
      return {
        success: false,
        error: `No active ${appName} connection for user`,
        data: null,
      };
    }

    // Execute tool via Composio v3 API
    const result = await composio.tools.execute(toolName, {
      connectedAccountId: connection.id,
      arguments: parameters,
    });

    return {
      success: result.successfull,
      data: result.data,
      error: result.error,
    };
  } catch (error: any) {
    console.error(`Composio tool execution error [${toolName}]:`, error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Map tool name to app name
 */
function getAppFromToolName(toolName: string): string {
  const upper = toolName.toUpperCase();
  if (upper.includes("GMAIL")) return "gmail";
  if (upper.includes("CALENDAR")) return "googlecalendar";
  if (upper.includes("CLASSROOM")) return "googleclassroom";
  if (upper.includes("DRIVE")) return "googledrive";
  return "gmail"; // fallback
}

/**
 * List available tools for user's connected apps
 */
export async function listAvailableTools(userId: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      entityIds: [userId],
    });

    const activeApps = connections.items
      .filter((conn: any) => conn.status === "ACTIVE")
      .map((conn: any) => conn.appUniqueId || conn.toolkit?.slug);

    const tools: any[] = [];

    for (const app of activeApps) {
      try {
        const actions = await composio.actions.list({ apps: app });
        tools.push(...actions.items);
      } catch (err) {
        console.error(`Error listing ${app} actions:`, err);
      }
    }

    return tools;
  } catch (error) {
    console.error("Error listing tools:", error);
    return [];
  }
}

export { composio };
