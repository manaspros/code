import { NextRequest, NextResponse } from "next/server";
import { getUserConnections } from "@/lib/composio";
import { APP_NAMES } from "@/lib/composio-actions";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await getUserConnections(userId);

    // Define available apps
    const availableApps = [
      APP_NAMES.GMAIL,
      APP_NAMES.GOOGLE_CLASSROOM, // google_classroom (with underscore!)
      APP_NAMES.GOOGLE_CALENDAR,
      APP_NAMES.GOOGLE_DRIVE,
      APP_NAMES.WHATSAPP,
      "telegram", // Not in APP_NAMES yet
    ];

    // Map connections to integration status
    const integrations = availableApps.map((app) => ({
      name: app,
      connected: connections.some(
        (conn: any) =>
          conn.appName.toLowerCase() === app.toLowerCase() &&
          conn.status === "ACTIVE"
      ),
      connection: connections.find(
        (conn: any) =>
          conn.appName.toLowerCase() === app.toLowerCase() &&
          conn.status === "ACTIVE"
      ),
    }));

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
