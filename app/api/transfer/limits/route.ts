import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { getNigeriaDayBounds } from "@/lib/day-boundaries";

import {
  DAILY_TRANSFER_COUNT_LIMIT,
  DAILY_TRANSFER_LIMIT,
  MAX_TRANSFER_AMOUNT,
  MIN_TRANSFER_AMOUNT,
} from "@/lib/transfer-limits";

export async function GET() {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authenticated.",
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
          message:
            "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const { start, end } =
      getNigeriaDayBounds();

    const [
      amountResult,
      transferCount,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          senderWalletId:
            user.wallet.id,

          type: "TRANSFER",
          status: "SUCCESSFUL",

          createdAt: {
            gte: start,
            lt: end,
          },
        },

        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.count({
        where: {
          senderWalletId:
            user.wallet.id,

          type: "TRANSFER",
          status: "SUCCESSFUL",

          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    ]);

    const usedToday =
      Number(
        amountResult._sum.amount ??
          0
      );

    return NextResponse.json({
      success: true,

      limits: {
        minimum:
          MIN_TRANSFER_AMOUNT,

        maximumPerTransfer:
          MAX_TRANSFER_AMOUNT,

        dailyAmount:
          DAILY_TRANSFER_LIMIT,

        dailyCount:
          DAILY_TRANSFER_COUNT_LIMIT,
      },

      usage: {
        amountUsed:
          usedToday,

        amountRemaining:
          Math.max(
            0,
            DAILY_TRANSFER_LIMIT -
              usedToday
          ),

        transfersUsed:
          transferCount,

        transfersRemaining:
          Math.max(
            0,
            DAILY_TRANSFER_COUNT_LIMIT -
              transferCount
          ),
      },
    });
  } catch (error) {
    console.error(
      "Transfer limit lookup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load transfer limits.",
      },
      { status: 500 }
    );
  }
}
