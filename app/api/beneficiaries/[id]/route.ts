import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteProps
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

    const { id } = await params;

    const beneficiary =
      await prisma.beneficiary.findFirst({
        where: {
          id,
          ownerId: userId,
        },

        include: {
          wallet: true,
        },
      });

    if (!beneficiary) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Saved recipient not found.",
        },
        { status: 404 }
      );
    }

    await prisma.beneficiary.delete({
      where: {
        id: beneficiary.id,
      },
    });

    await writeAuditLog({
      request,
      userId,
      action: "BENEFICIARY_REMOVE",
      entityType: "BENEFICIARY",
      entityId: beneficiary.id,

      metadata: {
        recipientLast4:
          beneficiary.wallet.accountNumber.slice(
            -4
          ),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Recipient removed.",
    });
  } catch (error) {
    console.error(
      "Remove beneficiary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to remove recipient.",
      },
      { status: 500 }
    );
  }
}
