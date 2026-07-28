import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";

export async function GET() {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          wallet: true,
        },
      });

    if (!user?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const transactions =
      await prisma.transaction.findMany({
        where: {
          senderWalletId:
            user.wallet.id,

          type: "TRANSFER",
          status: "SUCCESSFUL",
        },

        include: {
          receiverWallet: {
            include: {
              user: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 30,
      });

    const seen =
      new Set<string>();

    const recipients: {
      name: string;
      accountNumber: string;
    }[] = [];

    for (const transaction of transactions) {
      const wallet =
        transaction.receiverWallet;

      if (!wallet) {
        continue;
      }

      if (
        seen.has(
          wallet.accountNumber
        )
      ) {
        continue;
      }

      seen.add(
        wallet.accountNumber
      );

      recipients.push({
        name:
          `${wallet.user.firstName} ${wallet.user.lastName}`,

        accountNumber:
          wallet.accountNumber,
      });

      if (
        recipients.length === 5
      ) {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      recipients,
    });
  } catch (error) {
    console.error(
      "Recent recipients error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load recent recipients.",
      },
      { status: 500 }
    );
  }
}
