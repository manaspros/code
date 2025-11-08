import { NextRequest, NextResponse } from "next/server";
import { composio } from "@/lib/composio";

/**
 * Debug endpoint to list all available toolkits
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch toolkit list from Composio API
    const response = await fetch("https://backend.composio.dev/api/v3/toolkits", {
      headers: {
        "X-API-KEY": process.env.COMPOSIO_API_KEY!,
      },
    });

    const data = await response.json();

    // Filter for Google-related toolkits
    const googleToolkits = data.items?.filter((t: any) =>
      t.name?.toLowerCase().includes("google") ||
      t.name?.toLowerCase().includes("classroom")
    );

    console.log("All toolkits count:", data.items?.length || 0);
    console.log("Google toolkits:", JSON.stringify(googleToolkits, null, 2));

    return NextResponse.json({
      totalCount: data.items?.length || 0,
      googleToolkits: googleToolkits || [],
      classroomToolkit: data.items?.find((t: any) =>
        t.name?.toLowerCase().includes("classroom")
      ),
    });
  } catch (error: any) {
    console.error("Error fetching toolkits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}
