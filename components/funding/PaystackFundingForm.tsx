"use client";

import {
  FormEvent,
  useState,
} from "react";

export default function PaystackFundingForm() {
  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount < 100
    ) {
      setError(
        "Enter at least ₦100."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/fund/paystack/initialize",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount:
                numericAmount,

              idempotencyKey:
                crypto.randomUUID(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to start payment."
        );

        return;
      }

      if (
        !result.authorizationUrl
      ) {
        setError(
          "Paystack checkout URL was not returned."
        );

        return;
      }

      window.location.assign(
        result.authorizationUrl
      );
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="paystackAmount"
          className="mb-2 block text-sm font-medium"
        >
          Amount
        </label>

        <input
          id="paystackAmount"
          type="number"
          min="100"
          step="0.01"
          value={amount}
          onChange={(event) => {
            setAmount(
              event.target.value
            );

            setError("");
          }}
          placeholder="1000"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !amount
        }
        className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
      >
        {loading
          ? "Opening Paystack..."
          : "Continue with Paystack"}
      </button>

      <p className="text-xs text-slate-500">
        Test mode only. No real money
        will be charged during Day 45.
      </p>
    </form>
  );
}
