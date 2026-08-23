import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  UserPreferencesMap,
} from "@/lib/notifications/preferences";
import { DigestFrequency } from "@/lib/events/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/preferences
 * Returns authenticated user's notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserNotificationPreferences(user.id);
    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error("GET /api/notifications/preferences error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Updates authenticated user's notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emailEnabled, digestFrequency, preferences } = body;

    const validFrequencies: DigestFrequency[] = ["INSTANT", "DAILY", "WEEKLY", "NONE"];
    if (digestFrequency && !validFrequencies.includes(digestFrequency)) {
      return NextResponse.json(
        { error: `Invalid digestFrequency. Must be one of: ${validFrequencies.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await updateUserNotificationPreferences(user.id, {
      emailEnabled: typeof emailEnabled === "boolean" ? emailEnabled : undefined,
      digestFrequency,
      preferences: preferences as Partial<UserPreferencesMap>,
    });

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/notifications/preferences error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
