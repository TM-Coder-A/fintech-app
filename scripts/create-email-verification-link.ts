import "dotenv/config";

import {
  issueEmailVerificationToken,
} from "../lib/email-verification";

import { prisma } from "../lib/prisma";

async function main() {
  const email =
    process.argv[2]
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Usage: npx tsx scripts/create-email-verification-link.ts user@example.com"
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        emailVerified: true,
      },
    });

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  if (user.emailVerified) {
    throw new Error(
      "This user's email is already verified."
    );
  }

  const result =
    await issueEmailVerificationToken(
      user.id
    );

  console.log("");
  console.log(
    "TEST EMAIL VERIFICATION LINK"
  );
  console.log(
    "----------------------------"
  );

  console.log(
    `/verify-email?token=${result.token}`
  );

  console.log("");
  console.log(
    `Expires: ${result.expiresAt.toISOString()}`
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
