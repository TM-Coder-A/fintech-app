import { z } from "zod";

export const fundingSchema = z.object({
  amount: z
    .number()
    .finite()
    .min(100, "Minimum funding amount is ₦100.")
    .max(5_000_000, "Maximum funding amount is ₦5,000,000."),

  idempotencyKey: z
    .string()
    .uuid("Invalid funding request identifier."),
});

export type FundingInput =
  z.infer<typeof fundingSchema>;
