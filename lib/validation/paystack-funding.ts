import { z } from "zod";

export const paystackFundingSchema =
  z.object({
    amount: z
      .number()
      .finite()
      .min(
        100,
        "Minimum funding amount is ₦100."
      )
      .max(
        5_000_000,
        "Maximum funding amount is ₦5,000,000."
      )
      .refine(
        (value) =>
          Number.isInteger(
            Math.round(
              value * 100
            )
          ),
        "Invalid amount."
      ),

    idempotencyKey: z
      .string()
      .uuid(
        "Invalid payment request."
      ),
  });
