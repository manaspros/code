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
    // Step 1: Get auth config for the toolkit
    const authConfigs = await composio.authConfigs.list({
      toolkit: app,
    });

    if (!authConfigs.items || authConfigs.items.length === 0) {
      throw new Error(`No auth config found for toolkit: ${app}. Please create one in the Composio dashboard.`);
    }

    // Use the first available auth config (preferably Composio-managed)
    const authConfig = authConfigs.items.find((config: any) => config.isComposioManaged) || authConfigs.items[0];

    console.log(`Using auth config: ${authConfig.id} for toolkit: ${app}`);

    // Step 2: Initiate connection with user_id and auth_config_id
    const connection = await composio.connectedAccounts.initiate(
      firebaseUid,
      authConfig.id, // auth config ID, not app name!
      {
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/integrations`,
      }
    );

    return connection.redirectUrl;
  } catch (error: any) {
    console.error("Error generating connection link:", error);
    throw new Error(error.message || "Failed to generate connection link");
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
