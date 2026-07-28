import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
import { loginSchema } from "@/lib/validation/login";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: result.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          wallet: user.wallet
            ? {
                accountNumber:
                  user.wallet.accountNumber,
                currency: user.wallet.currency,
                balance:
                  user.wallet.balance.toString(),
              }
            : null,
        },
      },
      {
        status: 200,
      }
    );

    response.cookies.set(
      "session",
      sessionToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign in.",
      },
      {
        status: 500,
      }
    );
  }
}
