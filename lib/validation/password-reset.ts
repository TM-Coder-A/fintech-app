import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) =>
      value.toLowerCase()
    ),
});

export const resetPasswordSchema =
  z
    .object({
      token: z
        .string()
        .regex(
          /^[a-f0-9]{64}$/i,
          "Invalid password reset token."
        ),

      password: z
        .string()
        .min(
          8,
          "Password must be at least 8 characters."
        )
        .max(
          128,
          "Password is too long."
        )
        .regex(
          /[A-Z]/,
          "Password must contain an uppercase letter."
        )
        .regex(
          /[a-z]/,
          "Password must contain a lowercase letter."
        )
        .regex(
          /\d/,
          "Password must contain a number."
        ),

      confirmPassword: z.string(),
    })
    .refine(
      (data) =>
        data.password ===
        data.confirmPassword,
      {
        message:
          "Passwords do not match.",
        path: ["confirmPassword"],
      }
    );
