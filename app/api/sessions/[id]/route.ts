import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  getAuthenticatedSession,
} from "@/lib/auth/require-session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

    const { id } =
      await context.params;

    if (
      id === auth.sessionId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot revoke your current session here. Use Sign Out instead.",
        },
        { status: 400 }
      );
    }

    const session =
      await prisma.session.findFirst({
        where: {
          id,
          userId: auth.userId,
          revokedAt: null,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Session not found.",
        },
        { status: 404 }
      );
    }

    await prisma.session.update({
      where: {
        id: session.id,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    await writeAuditLog({
      request,
      userId: auth.userId,
      action: "SESSION_REVOKED",
      success: true,
      entityType: "SESSION",
      entityId: session.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Session revoked successfully.",
    });
  } catch (error) {
    console.error(
      "Session revoke error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to revoke session.",
      },
      { status: 500 }
    );
  }
}
