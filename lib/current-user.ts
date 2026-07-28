import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export async function getCurrentUser() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    redirect("/login");
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },

      include: {
        wallet: true,
      },
    });

  if (!user) {
    redirect("/login");
  }

  if (
    user.sessionVersion !==
    session.sessionVersion
  ) {
    redirect("/login");
  }

  return user;
}
