import { redirect } from "next/navigation";

import {
  getAuthenticatedSession,
} from "@/lib/auth/require-session";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session =
    await getAuthenticatedSession();

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

  return user;
}
