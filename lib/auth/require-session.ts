import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export async function getAuthenticatedUserId() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },

      select: {
        id: true,
        sessionVersion: true,
      },
    });

  if (!user) {
    return null;
  }

  if (
    user.sessionVersion !==
    session.sessionVersion
  ) {
    return null;
  }

  return user.id;
}
