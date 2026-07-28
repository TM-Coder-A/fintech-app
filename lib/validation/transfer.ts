import { z } from "zod";

export const transferSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be exactly 10 digits."),

  amount: z
    .number()
    .positive("Amount must be greater than zero.")
    .max(1000000, "Transfer amount exceeds the allowed limit."),

  narration: z
    .string()
    .trim()
    .max(80, "Narration cannot exceed 80 characters.")
    .optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
