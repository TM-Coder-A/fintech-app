import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { transferSchema } from "@/lib/validation/transfer";

function generateReference() {
  return `TX-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = transferSchema.safeParse(body);

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

    const sender = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        wallet: true,
      },
    });

    if (!sender?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Sender wallet not found.",
        },
        { status: 404 }
      );
    }

    const receiverWallet = await prisma.wallet.findUnique({
      where: {
        accountNumber: result.data.accountNumber,
      },
      include: {
        user: true,
      },
    });

    if (!receiverWallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient account not found.",
        },
        { status: 404 }
      );
    }

    if (receiverWallet.id === sender.wallet.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot transfer money to your own wallet.",
        },
        { status: 400 }
      );
    }

    const amount = result.data.amount;

    if (Number(sender.wallet.balance) < amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient balance.",
        },
        { status: 400 }
      );
    }

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedSender = await tx.wallet.updateMany({
        where: {
          id: sender.wallet!.id,
          balance: {
            gte: amount,
          },
        },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      if (updatedSender.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.wallet.update({
        where: {
          id: receiverWallet.id,
        },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return tx.transaction.create({
        data: {
          reference,
          amount,
          narration: result.data.narration,
          type: "TRANSFER",
          status: "SUCCESSFUL",
          senderWalletId: sender.wallet!.id,
          receiverWalletId: receiverWallet.id,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Transfer completed successfully.",
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount.toString(),
          recipient: `${receiverWallet.user.firstName} ${receiverWallet.user.lastName}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient balance.",
        },
        { status: 400 }
      );
    }

    console.error("Transfer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete transfer.",
      },
      { status: 500 }
    );
  }
}
