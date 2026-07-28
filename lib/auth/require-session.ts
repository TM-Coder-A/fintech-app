import {
  cookies,
  headers,
} from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import {
  verifySessionToken,
} from "@/lib/session";

export type AuthenticatedSession = {
  userId: string;
  sessionId: string;
  sessionVersion: number;
  email: string;
};

function getIpAddress(
  forwardedFor: string | null,
  realIp: string | null
) {
  if (forwardedFor) {
    return (
      forwardedFor
        .split(",")[0]
        ?.trim() || null
    );
  }

  return realIp;
}

export async function getAuthenticatedSession():
  Promise<AuthenticatedSession | null> {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  const payload =
    await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const session =
    await prisma.session.findUnique({
      where: {
        id: payload.sessionId,
      },

      select: {
        id: true,
        userId: true,
        sessionVersion: true,
        revokedAt: true,
        expiresAt: true,
        lastSeenAt: true,

        user: {
          select: {
            email: true,
            sessionVersion: true,
          },
        },
      },
    });

  if (!session) {
    return null;
  }

  if (
    session.userId !==
    payload.userId
  ) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  const now = new Date();

  if (
    session.expiresAt.getTime() <=
    now.getTime()
  ) {
    return null;
  }

  if (
    session.sessionVersion !==
      payload.sessionVersion ||
    session.user.sessionVersion !==
      payload.sessionVersion
  ) {
    return null;
  }

  const fiveMinutesAgo =
    Date.now() - 5 * 60 * 1000;

  if (
    session.lastSeenAt.getTime() <
    fiveMinutesAgo
  ) {
    try {
      const headerStore =
        await headers();

      const ipAddress =
        getIpAddress(
          headerStore.get(
            "x-forwarded-for"
          ),
          headerStore.get(
            "x-real-ip"
          )
        );

      const userAgent =
        headerStore.get(
          "user-agent"
        );

      await prisma.session.update({
        where: {
          id: session.id,
        },

        data: {
          lastSeenAt: now,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error(
        "Session activity update failed:",
        error
      );
    }
  }

  return {
    userId: session.userId,
    sessionId: session.id,
    sessionVersion:
      session.sessionVersion,
    email: session.user.email,
  };
}

export async function getAuthenticatedUserId():
  Promise<string | null> {
  const session =
    await getAuthenticatedSession();

  return session?.userId ?? null;
}
