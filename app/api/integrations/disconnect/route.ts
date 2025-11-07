import { NextRequest, NextResponse } from "next/server";
import { disconnectApp } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const { userId, connectionId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    const success = await disconnectApp(userId, connectionId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to disconnect app" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error disconnecting app:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect app" },
      { status: 500 }
    );
  }
}
