import { cookies } from "next/headers";

import { verifySessionToken } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export async function getAuthenticatedUserId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(token);

  if (!session?.userId) {
    return null;
  }

  return session.userId;
}
