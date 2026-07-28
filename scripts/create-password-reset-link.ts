import "dotenv/config";

import {
  issuePasswordResetToken,
} from "../lib/password-reset";

import { prisma } from "../lib/prisma";

async function main() {
  const email =
    process.argv[2]
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Usage: npx tsx scripts/create-password-reset-link.ts user@example.com"
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
      },
    });

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  const result =
    await issuePasswordResetToken(
      user.id
    );

  console.log("");
  console.log(
    "TEST PASSWORD RESET LINK"
  );
  console.log("------------------------");
  console.log(
    `/reset-password?token=${result.token}`
  );

  console.log("");
  console.log(
    `Expires: ${result.expiresAt.toISOString()}`
  );

  console.log("");
  console.log(
    "This helper is for development testing only."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
