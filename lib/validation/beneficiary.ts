import { z } from "zod";

export const beneficiarySchema = z.object({
  accountNumber: z
    .string()
    .regex(
      /^\d{10}$/,
      "Account number must be exactly 10 digits."
    ),

  nickname: z
    .string()
    .trim()
    .max(
      40,
      "Nickname cannot exceed 40 characters."
    )
    .optional(),
});
