import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { beneficiarySchema } from "@/lib/validation/beneficiary";

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

    const beneficiaries =
      await prisma.beneficiary.findMany({
        where: {
          ownerId: userId,
        },

        include: {
          wallet: {
            include: {
              user: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,

      beneficiaries:
        beneficiaries.map(
          (beneficiary) => ({
            id: beneficiary.id,

            name:
              `${beneficiary.wallet.user.firstName} ${beneficiary.wallet.user.lastName}`,

            nickname:
              beneficiary.nickname,

            accountNumber:
              beneficiary.wallet.accountNumber,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Beneficiary lookup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load recipients.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();

    const result =
      beneficiarySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const owner =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          wallet: true,
        },
      });

    if (!owner?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const recipientWallet =
      await prisma.wallet.findUnique({
        where: {
          accountNumber:
            result.data.accountNumber,
        },

        include: {
          user: true,
        },
      });

    if (!recipientWallet) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Recipient account not found.",
        },
        { status: 404 }
      );
    }

    if (
      recipientWallet.id ===
      owner.wallet.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot save your own account.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.beneficiary.findUnique({
        where: {
          ownerId_walletId: {
            ownerId: userId,
            walletId:
              recipientWallet.id,
          },
        },
      });

    if (existing) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message:
          "Recipient is already saved.",

        beneficiary: {
          id: existing.id,
        },
      });
    }

    const beneficiary =
      await prisma.beneficiary.create({
        data: {
          ownerId: userId,
          walletId:
            recipientWallet.id,

          nickname:
            result.data.nickname ||
            null,
        },
      });

    await writeAuditLog({
      request,
      userId,
      action: "BENEFICIARY_ADD",
      entityType: "BENEFICIARY",
      entityId: beneficiary.id,

      metadata: {
        recipientLast4:
          recipientWallet.accountNumber.slice(
            -4
          ),
      },
    });

    return NextResponse.json(
      {
        success: true,
        duplicate: false,

        message:
          "Recipient saved successfully.",

        beneficiary: {
          id: beneficiary.id,

          name:
            `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}`,

          accountNumber:
            recipientWallet.accountNumber,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Save beneficiary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save recipient.",
      },
      { status: 500 }
    );
  }
}
