import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

export async function GET(request: Request) {
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
        message: "Invalid session.",
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const accountNumber =
    url.searchParams.get("accountNumber");

  if (!accountNumber || !/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid account number.",
      },
      { status: 400 }
    );
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      accountNumber,
    },
    include: {
      user: true,
    },
  });

  if (!wallet) {
    return NextResponse.json(
      {
        success: false,
        message: "Recipient not found.",
      },
      { status: 404 }
    );
  }

  if (wallet.userId === session.userId) {
    return NextResponse.json(
      {
        success: false,
        message: "You cannot send money to yourself.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    recipient: {
      name: `${wallet.user.firstName} ${wallet.user.lastName}`,
      accountNumber: wallet.accountNumber,
    },
  });
}
