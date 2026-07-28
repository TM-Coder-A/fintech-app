import {
  SignJWT,
  jwtVerify,
} from "jose";

const sessionSecret =
  process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET is not configured."
  );
}

const secret = new TextEncoder().encode(
  sessionSecret
);

type CreateSessionInput = {
  userId: string;
  email: string;
  sessionVersion: number;
};

export async function createSessionToken({
  userId,
  email,
  sessionVersion,
}: CreateSessionInput) {
  return new SignJWT({
    email,
    sessionVersion,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
) {
  try {
    const { payload } =
      await jwtVerify(
        token,
        secret
      );

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.sessionVersion !==
        "number"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      sessionVersion:
        payload.sessionVersion,
    };
  } catch {
    return null;
  }
}
