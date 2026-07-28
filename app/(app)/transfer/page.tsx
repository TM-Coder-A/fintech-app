"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Send,
  User,
} from "lucide-react";

import { transferSchema } from "@/lib/validation/transfer";
import { formatCurrency } from "@/lib/format";

type Recipient = {
  name: string;
  accountNumber: string;
};

export default function TransferPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  const [recipient, setRecipient] =
    useState<Recipient | null>(null);

  const [recipientError, setRecipientError] =
    useState("");

  const [serverError, setServerError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

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

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setRecipient(null);
          setRecipientError(
            data.message ?? "Recipient lookup failed."
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setServerError("");
    setSuccessMessage("");

    const result = transferSchema.safeParse({
      accountNumber,
      amount: Number(amount),
      narration: narration || undefined,
    });

    if (!result.success) {
      setServerError(
        result.error.issues[0]?.message ??
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

    try {
      setLoading(true);

      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(
          data.message ?? "Transfer failed."
        );
        return;
      }

      setSuccessMessage(
        `Transfer successful. Reference: ${data.transaction.reference}`
      );

      setAmount("");
      setNarration("");
    } catch {
      setServerError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Send size={24} />
            </div>

            <h1 className="text-3xl font-bold">
              Send money
            </h1>

            <p className="mt-2 text-slate-600">
              Transfer money to another wallet.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Recipient account number
              </label>

              <input
                value={accountNumber}
                onChange={(event) => {
                  const value = event.target.value
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                    {recipient.accountNumber}
                  </p>
                </div>

                <CheckCircle2
                  className="ml-auto text-emerald-600"
                  size={22}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Amount
              </label>

              <input
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setServerError("");
                  setSuccessMessage("");
                }}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <p className="mt-2 text-sm text-slate-500">
                {amount && Number(amount) > 0
                  ? formatCurrency(Number(amount))
                  : formatCurrency(0)}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Narration
              </label>

              <input
                value={narration}
                onChange={(event) => {
                  setNarration(event.target.value);
                  setServerError("");
                  setSuccessMessage("");
                }}
                maxLength={80}
                placeholder="Optional transfer note"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                loading ||
                !recipient ||
                !amount
              }
              className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:bg-slate-300"
            >
              {loading
                ? "Sending..."
                : "Send Money"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
