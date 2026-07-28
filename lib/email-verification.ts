import {
  createHash,
  randomBytes,
} from "crypto";

import { prisma } from "@/lib/prisma";

export const EMAIL_VERIFICATION_TTL_HOURS =
  24;

export function hashEmailVerificationToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function issueEmailVerificationToken(
  userId: string
) {
  const token =
    randomBytes(32).toString("hex");

  const tokenHash =
    hashEmailVerificationToken(token);

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      EMAIL_VERIFICATION_TTL_HOURS *
        60 *
        60 *
        1000
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.emailVerificationToken.updateMany({
        where: {
          userId,
          usedAt: null,
        },

        data: {
          usedAt: now,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return {
    token,
    expiresAt,
  };
}
