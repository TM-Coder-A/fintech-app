import { SignJWT, jwtVerify } from "jose";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is not configured.");
}

const encodedSecret = new TextEncoder().encode(secret);

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSessionToken(
  payload: SessionPayload
) {
  return new SignJWT({
    email: payload.email,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      encodedSecret,
      {
        algorithms: ["HS256"],
      }
    );

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
