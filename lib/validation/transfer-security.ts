import { z } from "zod";

export const transferSecuritySchema = z.object({
  transfersEnabled: z.boolean(),

  password: z
    .string()
    .min(1, "Your current password is required.")
    .max(128, "Invalid password."),
});
