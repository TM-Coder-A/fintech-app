import {
  createHash,
  randomBytes,
} from "crypto";

import { prisma } from "./prisma";

export const PASSWORD_RESET_TTL_MINUTES =
  15;

export function hashPasswordResetToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function issuePasswordResetToken(
  userId: string
) {
  const token =
    randomBytes(32).toString("hex");

  const tokenHash =
    hashPasswordResetToken(token);

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      PASSWORD_RESET_TTL_MINUTES *
        60 *
        1000
  );

  await prisma.$transaction(
    async (tx) => {
      // Invalidate any previous unused reset links.
      await tx.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null,
        },

        data: {
          usedAt: now,
        },
      });

      await tx.passwordResetToken.create({
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
