import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required."),

    newPassword: z
      .string()
      .min(
        8,
        "New password must be at least 8 characters."
      )
      .max(
        128,
        "New password cannot exceed 128 characters."
      )
      .regex(
        /[A-Z]/,
        "New password must contain an uppercase letter."
      )
      .regex(
        /[a-z]/,
        "New password must contain a lowercase letter."
      )
      .regex(
        /\d/,
        "New password must contain a number."
      ),

    confirmPassword: z
      .string()
      .min(
        1,
        "Please confirm your new password."
      ),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.confirmPassword,
    {
      message:
        "New passwords do not match.",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) =>
      data.newPassword !==
      data.currentPassword,
    {
      message:
        "New password must be different from your current password.",
      path: ["newPassword"],
    }
  );

export type ChangePasswordInput =
  z.infer<
    typeof changePasswordSchema
  >;
