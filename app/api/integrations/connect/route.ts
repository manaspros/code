import { NextRequest, NextResponse } from "next/server";
import { getConnectionLink } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const { userId, app, redirectUrl } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!app) {
      return NextResponse.json({ error: "App name is required" }, { status: 400 });
    }

    const connectionUrl = await getConnectionLink(
      userId,
      app,
      redirectUrl
    );

    return NextResponse.json({ connectionUrl });
  } catch (error: any) {
    console.error("Error in connect route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate connection link" },
      { status: 500 }
    );
  }
}
