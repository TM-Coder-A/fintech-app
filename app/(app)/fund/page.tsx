"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { fundingSchema } from "@/lib/validation/funding";
import { formatCurrency } from "@/lib/format";

export default function FundPage() {
  const [amount, setAmount] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const key = crypto.randomUUID();

    const result = fundingSchema.safeParse({
      amount: Number(amount),
      idempotencyKey: key,
    });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ??
          "Invalid funding amount."
      );
      return;
    }

    setIdempotencyKey(key);
    setReviewing(true);
  }

  async function confirmFunding() {
    setError("");
    setMessage("");

    const result = fundingSchema.safeParse({
      amount: Number(amount),
      idempotencyKey,
    });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ??
          "Invalid funding request."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ?? "Funding failed."
        );
        return;
      }

      setMessage(
        data.duplicate
          ? `Funding already processed. Reference: ${data.transaction.reference}`
          : `Wallet funded successfully. Reference: ${data.transaction.reference}`
      );

      setAmount("");
      setReviewing(false);
      setIdempotencyKey("");
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              {reviewing ? (
                <ShieldCheck size={24} />
              ) : (
                <Plus size={24} />
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              {reviewing
                ? "Review funding"
                : "Add money"}
            </h1>

            <p className="mt-2 text-slate-600">
              {reviewing
                ? "Confirm the amount before funding your wallet."
                : "Add development funds to your wallet."}
            </p>
          </div>

          {!reviewing ? (
            <form
              onSubmit={handleReview}
              className="space-y-6"
            >
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
                    setAmount(event.target.value);
                    setError("");
                    setMessage("");
                  }}
                  type="number"
                  min="100"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />

                <p className="mt-2 text-sm text-slate-500">
                  {amount && Number(amount) > 0
                    ? formatCurrency(Number(amount))
                    : formatCurrency(0)}
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={20} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!amount}
                className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:bg-slate-300"
              >
                Review Funding
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500">
                  Amount to add
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(Number(amount))}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                This is a development funding flow. No external bank or card is being charged.
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewing(false);
                    setIdempotencyKey("");
                    setError("");
                  }}
                  disabled={loading}
                  className="rounded-xl border border-slate-300 px-5 py-3.5 font-semibold"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={confirmFunding}
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
                >
                  {loading
                    ? "Processing..."
                    : "Confirm Funding"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
