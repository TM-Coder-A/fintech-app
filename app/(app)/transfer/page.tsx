"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

import { transferSchema } from "@/lib/validation/transfer";
import { formatCurrency } from "@/lib/format";

type Recipient = {
  name: string;
  accountNumber: string;
};

export default function TransferPage() {
  const [accountNumber, setAccountNumber] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [narration, setNarration] =
    useState("");

  const [recipient, setRecipient] =
    useState<Recipient | null>(null);

  const [
    recipientError,
    setRecipientError,
  ] = useState("");

  const [serverError, setServerError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [reviewing, setReviewing] =
    useState(false);

  const [
    idempotencyKey,
    setIdempotencyKey,
  ] = useState("");

  useEffect(() => {
    if (accountNumber.length !== 10) {
      return;
    }

    let cancelled = false;

    async function lookupRecipient() {
      try {
        const response = await fetch(
          `/api/recipient?accountNumber=${accountNumber}`
        );

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setRecipient(null);

          setRecipientError(
            data.message ??
              "Recipient lookup failed."
          );

          return;
        }

        setRecipient(data.recipient);
        setRecipientError("");
      } catch {
        if (!cancelled) {
          setRecipient(null);

          setRecipientError(
            "Could not look up recipient."
          );
        }
      }
    }

    lookupRecipient();

    return () => {
      cancelled = true;
    };
  }, [accountNumber]);

  function handleReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setServerError("");
    setSuccessMessage("");

    const temporaryKey =
      crypto.randomUUID();

    const result =
      transferSchema.safeParse({
        accountNumber,
        amount: Number(amount),
        narration:
          narration || undefined,
        idempotencyKey:
          temporaryKey,
      });

    if (!result.success) {
      setServerError(
        result.error.issues[0]
          ?.message ??
          "Invalid transfer details."
      );

      return;
    }

    if (!recipient) {
      setServerError(
        "Please enter a valid recipient account."
      );

      return;
    }

    setIdempotencyKey(temporaryKey);
    setReviewing(true);
  }

  async function confirmTransfer() {
    setServerError("");
    setSuccessMessage("");

    if (
      !recipient ||
      !idempotencyKey
    ) {
      setServerError(
        "Transfer request is incomplete."
      );

      return;
    }

    const result =
      transferSchema.safeParse({
        accountNumber,
        amount: Number(amount),
        narration:
          narration || undefined,
        idempotencyKey,
      });

    if (!result.success) {
      setServerError(
        result.error.issues[0]
          ?.message ??
          "Invalid transfer details."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/transfer",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            result.data
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServerError(
          data.message ??
            "Transfer failed."
        );

        return;
      }

      setSuccessMessage(
        data.duplicate
          ? `Transfer already processed. Reference: ${data.transaction.reference}`
          : `Transfer successful. Reference: ${data.transaction.reference}`
      );

      setReviewing(false);
      setAmount("");
      setNarration("");
      setAccountNumber("");
      setRecipient(null);
      setIdempotencyKey("");
    } catch {
      setServerError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  function cancelReview() {
    if (loading) {
      return;
    }

    setReviewing(false);
    setIdempotencyKey("");
    setServerError("");
  }

  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              {reviewing ? (
                <ShieldCheck size={24} />
              ) : (
                <Send size={24} />
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              {reviewing
                ? "Review transfer"
                : "Send money"}
            </h1>

            <p className="mt-2 text-slate-600">
              {reviewing
                ? "Check everything carefully before confirming."
                : "Transfer money securely to another wallet."}
            </p>
          </div>

          {!reviewing ? (
            <form
              onSubmit={handleReview}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="accountNumber"
                  className="mb-2 block text-sm font-medium"
                >
                  Recipient account number
                </label>

                <input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                    setAccountNumber(value);
                    setRecipient(null);
                    setRecipientError("");
                    setServerError("");
                    setSuccessMessage("");
                  }}
                  inputMode="numeric"
                  placeholder="10-digit account number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />

                {recipientError && (
                  <p className="mt-2 text-sm text-rose-600">
                    {recipientError}
                  </p>
                )}
              </div>

              {recipient && (
                <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="rounded-full bg-white p-3 text-emerald-600">
                    <User size={20} />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {recipient.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {
                        recipient.accountNumber
                      }
                    </p>
                  </div>

                  <CheckCircle2
                    className="ml-auto text-emerald-600"
                    size={22}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium"
                >
                  Amount
                </label>

                <input
                  id="amount"
                  value={amount}
                  onChange={(event) => {
                    setAmount(
                      event.target.value
                    );

                    setServerError("");
                  }}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />

                <p className="mt-2 text-sm text-slate-500">
                  {amount &&
                  Number(amount) > 0
                    ? formatCurrency(
                        Number(amount)
                      )
                    : formatCurrency(0)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="narration"
                  className="mb-2 block text-sm font-medium"
                >
                  Narration
                </label>

                <input
                  id="narration"
                  value={narration}
                  onChange={(event) =>
                    setNarration(
                      event.target.value
                    )
                  }
                  maxLength={80}
                  placeholder="Optional transfer note"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              {serverError && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {serverError}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  !recipient || !amount
                }
                className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Review Transfer
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="space-y-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Recipient
                    </span>

                    <span className="text-right font-semibold">
                      {recipient?.name}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Account
                    </span>

                    <span className="font-mono">
                      {accountNumber}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-4">
                    <span className="text-slate-500">
                      Amount
                    </span>

                    <span className="text-xl font-bold">
                      {formatCurrency(
                        Number(amount)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Narration
                    </span>

                    <span className="max-w-[220px] text-right">
                      {narration || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Confirm the recipient and
                amount carefully. The transfer
                will change both wallet
                balances.
              </div>

              {serverError && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {serverError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={cancelReview}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3.5 font-semibold text-slate-700 disabled:opacity-50"
                >
                  <ArrowLeft size={18} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={confirmTransfer}
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
                >
                  {loading
                    ? "Processing..."
                    : "Confirm Transfer"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
