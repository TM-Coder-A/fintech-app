import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { prisma } from "@/lib/prisma";
import { transferSecuritySchema } from "@/lib/validation/transfer-security";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },

      select: {
        transfersEnabled: true,
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

    return NextResponse.json({
      success: true,
      transfersEnabled: wallet.transfersEnabled,
    });
  } catch (error) {
    console.error(
      "Transfer security lookup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load transfer security settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
        },
        { status: 400 }
      );
    }

    const result =
      transferSecuritySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Invalid request.",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        passwordHash: true,

        wallet: {
          select: {
            id: true,
            transfersEnabled: true,
          },
        },
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

    const passwordMatches = await compare(
      result.data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_SECURITY_CHANGE_FAILED",
        success: false,
        entityType: "WALLET",
        entityId: user.wallet.id,
        metadata: {
          reason: "incorrect_password",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 403 }
      );
    }

    const requestedState =
      result.data.transfersEnabled;

    if (
      user.wallet.transfersEnabled ===
      requestedState
    ) {
      return NextResponse.json({
        success: true,
        message: requestedState
          ? "Transfers are already enabled."
          : "Transfers are already disabled.",
        transfersEnabled: requestedState,
      });
    }

    const wallet = await prisma.wallet.update({
      where: {
        id: user.wallet.id,
      },

      data: {
        transfersEnabled: requestedState,
      },

      select: {
        id: true,
        transfersEnabled: true,
      },
    });

    await writeAuditLog({
      request,
      userId,
      action: requestedState
        ? "TRANSFERS_ENABLED"
        : "TRANSFERS_DISABLED",
      success: true,
      entityType: "WALLET",
      entityId: wallet.id,
      metadata: {
        previousState:
          user.wallet.transfersEnabled,
        newState: wallet.transfersEnabled,
      },
    });

    return NextResponse.json({
      success: true,

      message: wallet.transfersEnabled
        ? "Outgoing transfers have been enabled."
        : "Outgoing transfers have been disabled.",

      transfersEnabled:
        wallet.transfersEnabled,
    });
  } catch (error) {
    console.error(
      "Transfer security update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update transfer security settings.",
      },
      { status: 500 }
    );
  }
}
