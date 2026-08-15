import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return NextResponse.json(
    { success: true, user },
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
