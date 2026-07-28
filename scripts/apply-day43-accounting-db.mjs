import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("DIRECT_URL is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
});

const sql = `
BEGIN;

-- =========================================================
-- 1. ENUMS
-- =========================================================

DO $$
BEGIN
  CREATE TYPE "AccountingAccountType"
  AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'INCOME',
    'EXPENSE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "AccountingSide"
  AS ENUM (
    'DEBIT',
    'CREDIT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;


-- =========================================================
-- 2. ACCOUNTING ACCOUNT
-- =========================================================

CREATE TABLE IF NOT EXISTS public."AccountingAccount" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AccountingAccountType" NOT NULL,
  "walletId" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountingAccount_pkey"
    PRIMARY KEY ("id")
);


-- =========================================================
-- 3. ACCOUNTING POSTING
-- =========================================================

CREATE TABLE IF NOT EXISTS public."AccountingPosting" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "transactionId" TEXT,
  "description" TEXT,
  "postedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountingPosting_pkey"
    PRIMARY KEY ("id")
);


-- =========================================================
-- 4. ACCOUNTING LINE
-- =========================================================

CREATE TABLE IF NOT EXISTS public."AccountingLine" (
  "id" TEXT NOT NULL,
  "postingId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "side" "AccountingSide" NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountingLine_pkey"
    PRIMARY KEY ("id")
);


-- =========================================================
-- 5. FOREIGN KEYS
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'AccountingAccount_walletId_fkey'
  ) THEN

    ALTER TABLE public."AccountingAccount"

    ADD CONSTRAINT
      "AccountingAccount_walletId_fkey"

    FOREIGN KEY ("walletId")
    REFERENCES public."Wallet"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

  END IF;
END
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'AccountingPosting_transactionId_fkey'
  ) THEN

    ALTER TABLE public."AccountingPosting"

    ADD CONSTRAINT
      "AccountingPosting_transactionId_fkey"

    FOREIGN KEY ("transactionId")
    REFERENCES public."Transaction"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

  END IF;
END
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'AccountingLine_postingId_fkey'
  ) THEN

    ALTER TABLE public."AccountingLine"

    ADD CONSTRAINT
      "AccountingLine_postingId_fkey"

    FOREIGN KEY ("postingId")
    REFERENCES public."AccountingPosting"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

  END IF;
END
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'AccountingLine_accountId_fkey'
  ) THEN

    ALTER TABLE public."AccountingLine"

    ADD CONSTRAINT
      "AccountingLine_accountId_fkey"

    FOREIGN KEY ("accountId")
    REFERENCES public."AccountingAccount"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

  END IF;
END
$$;


-- =========================================================
-- 6. POSITIVE AMOUNT CHECK
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'AccountingLine_amount_positive'
  ) THEN

    ALTER TABLE public."AccountingLine"

    ADD CONSTRAINT
      "AccountingLine_amount_positive"

    CHECK ("amount" > 0);

  END IF;
END
$$;


-- =========================================================
-- 7. INDEXES
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS
"AccountingAccount_code_key"
ON public."AccountingAccount" ("code");

CREATE UNIQUE INDEX IF NOT EXISTS
"AccountingAccount_walletId_key"
ON public."AccountingAccount" ("walletId");

CREATE INDEX IF NOT EXISTS
"AccountingAccount_type_idx"
ON public."AccountingAccount" ("type");


CREATE UNIQUE INDEX IF NOT EXISTS
"AccountingPosting_reference_key"
ON public."AccountingPosting" ("reference");

CREATE UNIQUE INDEX IF NOT EXISTS
"AccountingPosting_transactionId_key"
ON public."AccountingPosting" ("transactionId");

CREATE INDEX IF NOT EXISTS
"AccountingPosting_postedAt_idx"
ON public."AccountingPosting" ("postedAt");

CREATE INDEX IF NOT EXISTS
"AccountingPosting_createdAt_idx"
ON public."AccountingPosting" ("createdAt");


CREATE INDEX IF NOT EXISTS
"AccountingLine_postingId_idx"
ON public."AccountingLine" ("postingId");

CREATE INDEX IF NOT EXISTS
"AccountingLine_accountId_idx"
ON public."AccountingLine" ("accountId");

CREATE INDEX IF NOT EXISTS
"AccountingLine_createdAt_idx"
ON public."AccountingLine" ("createdAt");


-- =========================================================
-- 8. PROTECT ACCOUNTING LINES AFTER POSTING
-- =========================================================

CREATE OR REPLACE FUNCTION
public.guard_accounting_line_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  posting_time TIMESTAMP(3);
  target_posting_id TEXT;
BEGIN

  IF TG_OP = 'DELETE' THEN
    target_posting_id :=
      OLD."postingId";
  ELSE
    target_posting_id :=
      NEW."postingId";
  END IF;

  SELECT "postedAt"
  INTO posting_time
  FROM public."AccountingPosting"
  WHERE "id" =
    target_posting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Accounting posting does not exist.';
  END IF;

  IF posting_time IS NOT NULL THEN
    RAISE EXCEPTION
      'Posted accounting lines are immutable.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
"AccountingLine_mutation_guard"
ON public."AccountingLine";

CREATE TRIGGER
"AccountingLine_mutation_guard"

BEFORE INSERT OR UPDATE OR DELETE
ON public."AccountingLine"

FOR EACH ROW

EXECUTE FUNCTION
public.guard_accounting_line_mutation();


-- =========================================================
-- 9. ENFORCE BALANCED POSTINGS
-- =========================================================

CREATE OR REPLACE FUNCTION
public.finalize_accounting_posting()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  debit_total NUMERIC;
  credit_total NUMERIC;
  line_count INTEGER;
  currency_count INTEGER;
BEGIN

  IF OLD."postedAt" IS NOT NULL THEN
    RAISE EXCEPTION
      'Posted accounting postings are immutable.';
  END IF;

  IF NEW."postedAt" IS NULL THEN
    RAISE EXCEPTION
      'The only permitted posting update is finalisation.';
  END IF;

  IF
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."reference"
      IS DISTINCT FROM OLD."reference"
    OR NEW."transactionId"
      IS DISTINCT FROM OLD."transactionId"
    OR NEW."description"
      IS DISTINCT FROM OLD."description"
    OR NEW."createdAt"
      IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION
      'Accounting posting fields cannot be changed during finalisation.';
  END IF;

  SELECT

    COALESCE(
      SUM(
        CASE
          WHEN "side" = 'DEBIT'
          THEN "amount"
          ELSE 0
        END
      ),
      0
    ),

    COALESCE(
      SUM(
        CASE
          WHEN "side" = 'CREDIT'
          THEN "amount"
          ELSE 0
        END
      ),
      0
    ),

    COUNT(*),

    COUNT(
      DISTINCT "currency"
    )

  INTO
    debit_total,
    credit_total,
    line_count,
    currency_count

  FROM public."AccountingLine"

  WHERE "postingId" =
    OLD."id";

  IF line_count < 2 THEN
    RAISE EXCEPTION
      'An accounting posting requires at least two lines.';
  END IF;

  IF debit_total <> credit_total THEN
    RAISE EXCEPTION
      'Accounting posting is unbalanced. Debits: %, Credits: %',
      debit_total,
      credit_total;
  END IF;

  IF currency_count <> 1 THEN
    RAISE EXCEPTION
      'All lines in an accounting posting must use the same currency.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
"AccountingPosting_finalize_guard"
ON public."AccountingPosting";

CREATE TRIGGER
"AccountingPosting_finalize_guard"

BEFORE UPDATE
ON public."AccountingPosting"

FOR EACH ROW

EXECUTE FUNCTION
public.finalize_accounting_posting();


-- =========================================================
-- 10. PROTECT POSTED BATCHES FROM DELETE
-- =========================================================

CREATE OR REPLACE FUNCTION
public.guard_accounting_posting_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

  IF OLD."postedAt" IS NOT NULL THEN
    RAISE EXCEPTION
      'Posted accounting postings are immutable.';
  END IF;

  RETURN OLD;
END;
$$;


DROP TRIGGER IF EXISTS
"AccountingPosting_delete_guard"
ON public."AccountingPosting";

CREATE TRIGGER
"AccountingPosting_delete_guard"

BEFORE DELETE
ON public."AccountingPosting"

FOR EACH ROW

EXECUTE FUNCTION
public.guard_accounting_posting_delete();


COMMIT;
`;

try {
  await client.connect();

  console.log(
    "Connected to Supabase."
  );

  console.log(
    "Applying Day 43 accounting database setup..."
  );

  await client.query(sql);

  console.log(
    "Day 43 accounting database setup completed successfully."
  );

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'AccountingAccount',
      'AccountingPosting',
      'AccountingLine'
    )
    ORDER BY table_name;
  `);

  console.table(result.rows);
} catch (error) {
  console.error(
    "Day 43 database setup failed:"
  );

  console.error(error);

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
