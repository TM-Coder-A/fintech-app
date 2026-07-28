import { NextResponse } from "next/server";

import {
  getAuthenticatedSession,
} from "@/lib/auth/require-session";
import {
  describeDevice,
} from "@/lib/auth/device";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const sessions =
      await prisma.session.findMany({
        where: {
          userId: auth.userId,
          sessionVersion:
            auth.sessionVersion,
          revokedAt: null,

          expiresAt: {
            gt: new Date(),
          },
        },

        orderBy: {
          lastSeenAt: "desc",
        },

        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          lastSeenAt: true,
          expiresAt: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      success: true,

      sessions: sessions.map(
        (session) => ({
          id: session.id,

          current:
            session.id ===
            auth.sessionId,

          device: describeDevice(
            session.userAgent
          ),

          ipAddress:
            session.ipAddress,

          lastSeenAt:
            session.lastSeenAt,

          createdAt:
            session.createdAt,

          expiresAt:
            session.expiresAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Session list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load sessions.",
      },
      { status: 500 }
    );
  }
}
