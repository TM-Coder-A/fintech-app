import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/register";

function generateAccountNumber() {
  return Math.floor(
    1000000000 + Math.random() * 9000000000
  ).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);

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

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
    } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: {
          phone,
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this phone number already exists.",
          },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let accountNumber = generateAccountNumber();

    while (
      await prisma.wallet.findUnique({
        where: {
          accountNumber,
        },
      })
    ) {
      accountNumber = generateAccountNumber();
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,

        wallet: {
          create: {
            accountNumber,
            currency: "NGN",
            balance: 0,
          },
        },
      },

      include: {
        wallet: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          wallet: {
            accountNumber: user.wallet?.accountNumber,
            currency: user.wallet?.currency,
            balance: user.wallet?.balance.toString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account.",
      },
      { status: 500 }
    );
  }
}
