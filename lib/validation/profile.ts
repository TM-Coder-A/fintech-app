import { z } from "zod";

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50),

  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20)
    .regex(
      /^[+0-9()\-\s]+$/,
      "Phone number contains invalid characters."
    ),
});

export type ProfileInput =
  z.infer<typeof profileSchema>;
