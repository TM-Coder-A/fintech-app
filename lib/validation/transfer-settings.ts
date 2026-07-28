import { z } from "zod";

import {
  DAILY_TRANSFER_LIMIT,
} from "@/lib/transfer-limits";

export const transferSettingsSchema =
  z.object({
    dailyLimit: z
      .number()
      .finite()
      .min(
        1,
        "Daily limit must be at least ₦1."
      )
      .max(
        DAILY_TRANSFER_LIMIT,
        `Daily limit cannot exceed ₦${DAILY_TRANSFER_LIMIT.toLocaleString(
          "en-NG"
        )}.`
      )
      .nullable(),
  });
