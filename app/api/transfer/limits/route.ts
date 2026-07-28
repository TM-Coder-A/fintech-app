import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { getNigeriaDayBounds } from "@/lib/day-boundaries";
import { transferSettingsSchema } from "@/lib/validation/transfer-settings";

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

    const personalLimit =
      user.wallet
        .personalDailyTransferLimit !==
      null
        ? Number(
            user.wallet
              .personalDailyTransferLimit
          )
        : null;

    const effectiveDailyLimit =
      personalLimit === null
        ? DAILY_TRANSFER_LIMIT
        : Math.min(
            personalLimit,
            DAILY_TRANSFER_LIMIT
          );

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

    const amountUsed =
      Number(
        amountResult._sum.amount ?? 0
      );

    return NextResponse.json({
      success: true,

      limits: {
        minimum:
          MIN_TRANSFER_AMOUNT,

        maximumPerTransfer:
          MAX_TRANSFER_AMOUNT,

        platformDailyAmount:
          DAILY_TRANSFER_LIMIT,

        personalDailyAmount:
          personalLimit,

        effectiveDailyAmount:
          effectiveDailyLimit,

        dailyCount:
          DAILY_TRANSFER_COUNT_LIMIT,
      },

      usage: {
        amountUsed,

        amountRemaining:
          Math.max(
            0,
            effectiveDailyLimit -
              amountUsed
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

export async function PATCH(
  request: Request
) {
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

    const body =
      await request.json();

    const result =
      transferSettingsSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid transfer limit.",
          errors:
            result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const wallet =
      await prisma.wallet.findUnique({
        where: {
          userId,
        },
      });

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const oldLimit =
      wallet.personalDailyTransferLimit !==
      null
        ? Number(
            wallet.personalDailyTransferLimit
          )
        : null;

    const updatedWallet =
      await prisma.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          personalDailyTransferLimit:
            result.data.dailyLimit,
        },
      });

    await writeAuditLog({
      request,
      userId,
      action:
        "TRANSFER_LIMIT_UPDATE",

      entityType: "WALLET",
      entityId: wallet.id,

      metadata: {
        previousLimit:
          oldLimit,

        newLimit:
          result.data.dailyLimit,

        platformLimit:
          DAILY_TRANSFER_LIMIT,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        result.data.dailyLimit ===
        null
          ? "Personal transfer limit removed."
          : "Daily transfer limit updated.",

      dailyLimit:
        updatedWallet
          .personalDailyTransferLimit !==
        null
          ? Number(
              updatedWallet
                .personalDailyTransferLimit
            )
          : null,
    });
  } catch (error) {
    console.error(
      "Transfer settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update transfer limit.",
      },
      { status: 500 }
    );
  }
}
