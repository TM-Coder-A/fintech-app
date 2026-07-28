import { NextResponse } from "next/server";
import { transferSchema } from "@/lib/validation/transfer";

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(
      {
        success: true,
        message: "Transfer data accepted by server.",
        data: result.data,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request.",
      },
      { status: 400 }
    );
  }
}
