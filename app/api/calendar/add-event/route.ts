import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";

/**
 * API endpoint to add events to Google Calendar (one-click sync)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, event } = await req.json();

    if (!userId || !event) {
      return NextResponse.json(
        { error: "User ID and event data are required" },
        { status: 400 }
      );
    }

    // Create calendar event using Composio v3
    const result = await executeAction(userId, "GOOGLECALENDAR_CREATE_EVENT", {
      summary: event.title,
      description: event.description || "",
      start: {
        dateTime: event.startDate,
        timeZone: event.timeZone || "America/New_York",
      },
      end: {
        dateTime: event.endDate || event.startDate,
        timeZone: event.timeZone || "America/New_York",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    });

    return NextResponse.json({
      success: true,
      event: result.data || result,
    });
  } catch (error: any) {
    console.error("Error adding calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add calendar event" },
      { status: 500 }
    );
  }
}
