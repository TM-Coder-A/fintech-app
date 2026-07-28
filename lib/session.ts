import {
  jwtVerify,
  SignJWT,
} from "jose";

import { prisma } from "@/lib/prisma";

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7;

const secret =
  process.env.SESSION_SECRET;

if (!secret) {
  throw new Error(
    "SESSION_SECRET is not configured."
  );
}

const encodedSecret =
  new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: string;
  email: string;
  sessionVersion: number;
  sessionId: string;
};

type CreateSessionInput = {
  userId: string;
  email: string;
  sessionVersion: number;
};

export function createSessionToken(
  input: CreateSessionInput
): Promise<string>;

export function createSessionToken(
  userId: string,
  email: string,
  sessionVersion: number
): Promise<string>;

export async function createSessionToken(
  inputOrUserId:
    | CreateSessionInput
    | string,
  emailArg?: string,
  sessionVersionArg?: number
): Promise<string> {
  let input: CreateSessionInput;

  if (
    typeof inputOrUserId ===
    "string"
  ) {
    if (
      !emailArg ||
      typeof sessionVersionArg !==
        "number"
    ) {
      throw new Error(
        "Invalid session arguments."
      );
    }

    input = {
      userId: inputOrUserId,
      email: emailArg,
      sessionVersion:
        sessionVersionArg,
    };
  } else {
    input = inputOrUserId;
  }

  const expiresAt = new Date(
    Date.now() +
      SESSION_DURATION_SECONDS * 1000
  );

  const databaseSession =
    await prisma.session.create({
      data: {
        userId: input.userId,
        sessionVersion:
          input.sessionVersion,
        expiresAt,
      },
    });

  return new SignJWT({
    email: input.email,
    sessionVersion:
      input.sessionVersion,
    sessionId:
      databaseSession.id,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(input.userId)
    .setJti(databaseSession.id)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(
        expiresAt.getTime() / 1000
      )
    )
    .sign(encodedSecret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } =
      await jwtVerify(
        token,
        encodedSecret,
        {
          algorithms: ["HS256"],
        }
      );

    if (
      typeof payload.sub !==
        "string" ||
      typeof payload.email !==
        "string" ||
      typeof payload.sessionVersion !==
        "number" ||
      typeof payload.sessionId !==
        "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      sessionVersion:
        payload.sessionVersion,
      sessionId:
        payload.sessionId,
    };
  } catch {
    return null;
  }
}
