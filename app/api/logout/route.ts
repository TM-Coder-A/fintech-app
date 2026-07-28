import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export async function POST(
  request: Request
) {
  const userId =
    await getAuthenticatedUserId();

  if (userId) {
    await writeAuditLog({
      request,
      userId,
      action: "LOGOUT",
    });
  }

  const cookieStore =
    await cookies();

  cookieStore.delete(
    SESSION_COOKIE_NAME
  );

  return NextResponse.json({
    success: true,
    message: "Logged out.",
  });
}
