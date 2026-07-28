import { z } from "zod";

import {
  MAX_TRANSFER_AMOUNT,
  MIN_TRANSFER_AMOUNT,
} from "@/lib/transfer-limits";

export const transferSchema = z.object({
  accountNumber: z
    .string()
    .regex(
      /^\d{10}$/,
      "Account number must be exactly 10 digits."
    ),

  amount: z
    .number()
    .finite()
    .min(
      MIN_TRANSFER_AMOUNT,
      `Minimum transfer amount is ₦${MIN_TRANSFER_AMOUNT}.`
    )
    .max(
      MAX_TRANSFER_AMOUNT,
      `Maximum transfer amount is ₦${MAX_TRANSFER_AMOUNT.toLocaleString(
        "en-NG"
      )}.`
    ),

  narration: z
    .string()
    .trim()
    .max(
      80,
      "Narration cannot exceed 80 characters."
    )
    .optional(),

  idempotencyKey: z
    .string()
    .uuid("Invalid transfer request identifier."),
});

export type TransferInput =
  z.infer<typeof transferSchema>;
