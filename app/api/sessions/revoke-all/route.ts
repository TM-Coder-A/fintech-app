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
    const auth =
      await getAuthenticatedSession();

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authenticated.",
        },
        { status: 401 }
      );
    }

    await prisma.session.updateMany({
      where: {
        userId: auth.userId,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    await writeAuditLog({
      request,
      userId: auth.userId,
      action:
        "SESSION_REVOKE_ALL",
      success: true,
      entityType: "USER",
      entityId: auth.userId,
    });

    const response =
      NextResponse.json({
        success: true,
        message:
          "All sessions have been signed out.",
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
      "Revoke-all sessions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to sign out all sessions.",
      },
      { status: 500 }
    );
  }
}
