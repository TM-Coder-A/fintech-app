import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

const sql = `
BEGIN;

DO $$
BEGIN
  CREATE TYPE "FundingProvider"
  AS ENUM ('PAYSTACK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "FundingAttemptStatus"
  AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESSFUL',
    'FAILED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public."FundingAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "provider" "FundingProvider" NOT NULL DEFAULT 'PAYSTACK',
  "status" "FundingAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "authorizationUrl" TEXT,
  "accessCode" TEXT,
  "providerTransactionId" TEXT,
  "channel" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FundingAttempt_pkey"
    PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FundingAttempt_userId_fkey'
  ) THEN
    ALTER TABLE public."FundingAttempt"
    ADD CONSTRAINT "FundingAttempt_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES public."User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FundingAttempt_walletId_fkey'
  ) THEN
    ALTER TABLE public."FundingAttempt"
    ADD CONSTRAINT "FundingAttempt_walletId_fkey"
    FOREIGN KEY ("walletId")
    REFERENCES public."Wallet"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
"FundingAttempt_idempotencyKey_key"
ON public."FundingAttempt" ("idempotencyKey");

CREATE UNIQUE INDEX IF NOT EXISTS
"FundingAttempt_reference_key"
ON public."FundingAttempt" ("reference");

CREATE INDEX IF NOT EXISTS
"FundingAttempt_userId_idx"
ON public."FundingAttempt" ("userId");

CREATE INDEX IF NOT EXISTS
"FundingAttempt_walletId_idx"
ON public."FundingAttempt" ("walletId");

CREATE INDEX IF NOT EXISTS
"FundingAttempt_status_idx"
ON public."FundingAttempt" ("status");

CREATE INDEX IF NOT EXISTS
"FundingAttempt_createdAt_idx"
ON public."FundingAttempt" ("createdAt");

COMMIT;
`;

try {
  await client.connect();
  await client.query(sql);

  console.log(
    "✅ Day 45 Paystack database setup complete."
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
