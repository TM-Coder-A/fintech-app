export const SESSION_COOKIE_NAME = "session";

export const SESSION_MAX_AGE =
  60 * 60 * 24 * 7;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}
