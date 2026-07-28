import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  getAuthenticatedSession,
} from "@/lib/auth/require-session";
import {
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const session =
      await getAuthenticatedSession();

    if (session) {
      await prisma.session.updateMany({
        where: {
          id: session.sessionId,
          userId: session.userId,
          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      await writeAuditLog({
        request,
        userId: session.userId,
        action: "LOGOUT",
        success: true,
        entityType: "SESSION",
        entityId:
          session.sessionId,
      });
    }

    const response =
      NextResponse.json({
        success: true,
        message:
          "Signed out successfully.",
      });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
