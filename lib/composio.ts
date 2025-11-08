import { Composio } from "@composio/core";

// Initialize Composio v3 client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

// Check if user has connected an app
export async function hasConnection(firebaseUid: string, app: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [firebaseUid],
    });

    return connections.items.some(
      (conn: any) =>
        conn.toolkitSlug?.toLowerCase() === app.toLowerCase() &&
        conn.status === "ACTIVE"
    );
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
}

// Get connection URL for OAuth
export async function getConnectionLink(
  firebaseUid: string,
  app: string,
  redirectUrl?: string
) {
  try {
    const connection = await composio.connectedAccounts.initiate(
      firebaseUid,
      app,
      {
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/integrations`,
      }
    );

    return connection.redirectUrl;
  } catch (error) {
    console.error("Error generating connection link:", error);
    throw error;
  }
}

// Get list of all user connections
export async function getUserConnections(firebaseUid: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [firebaseUid],
    });
    return connections.items || [];
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
}

// Disconnect an app
export async function disconnectApp(firebaseUid: string, connectionId: string) {
  try {
    await composio.connectedAccounts.delete(connectionId);
    return true;
  } catch (error) {
    console.error("Error disconnecting app:", error);
    return false;
  }
}

// Execute an action with Composio v3
export async function executeAction(
  firebaseUid: string,
  action: string,
  params: any = {}
) {
  try {
    const result = await composio.tools.execute(
      action,
      params,
      firebaseUid
    );
    return result;
  } catch (error) {
    console.error("Error executing action:", error);
    throw error;
  }
}

// Get tools for AI agent using v3 API
export async function getToolsForEntity(firebaseUid: string, apps: string[]) {
  try {
    const tools = await composio.tools.get({
      toolkits: apps,
      userId: firebaseUid,
    });
    return tools;
  } catch (error) {
    console.error("Error getting tools:", error);
    return [];
  }
}
