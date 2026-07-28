import { prisma } from "@/lib/prisma";

export async function hasVerifiedEmail(
  userId: string
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        emailVerified: true,
      },
    });

  return (
    user?.emailVerified === true
  );
}
