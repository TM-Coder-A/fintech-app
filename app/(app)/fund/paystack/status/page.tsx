"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

type PaymentState = {
  verified: boolean;
  paystackStatus: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  walletCredited: boolean;
};

export default function PaystackStatusPage() {
  const [payment, setPayment] =
    useState<PaymentState | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const reference =
      new URLSearchParams(
        window.location.search
      ).get("reference");

    if (!reference) {
      Promise.resolve().then(
        () => {
          if (!cancelled) {
            setError(
              "Payment reference is missing."
            );

            setLoading(false);
          }
        }
      );

      return () => {
        cancelled = true;
      };
    }

    fetch(
      `/api/fund/paystack/verify?reference=${encodeURIComponent(
        reference
      )}`
    )
      .then(async (response) => {
        const result =
          await response.json();

        return {
          ok: response.ok,
          result,
        };
      })
      .then(({ ok, result }) => {
        if (cancelled) {
          return;
        }

        if (!ok) {
          setError(
            result.message ??
              "Unable to verify payment."
          );

          return;
        }

        setPayment(
          result.payment
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not reach the server."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="p-10">
        Verifying payment...
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto max-w-xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-7">
          {error ? (
            <>
              <XCircle
                size={38}
                className="text-rose-600"
              />

              <h1 className="mt-5 text-2xl font-bold">
                Verification failed
              </h1>

              <p className="mt-3 text-rose-700">
                {error}
              </p>
            </>
          ) : payment?.verified ? (
            <>
              <CheckCircle2
                size={38}
                className="text-emerald-600"
              />

              <h1 className="mt-5 text-2xl font-bold">
                Payment confirmed
              </h1>

              <p className="mt-3 text-slate-600">
                Paystack has confirmed
                this test payment.
              </p>

              <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-5 text-sm">
                <p>
                  Amount: ₦
                  {payment.amount.toLocaleString(
                    "en-NG"
                  )}
                </p>

                <p>
                  Status:{" "}
                  {payment.paystackStatus}
                </p>

                <p>
                  Channel:{" "}
                  {payment.channel ??
                    "Unknown"}
                </p>
              </div>

              <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <Clock3
                  size={19}
                  className="shrink-0"
                />

                <p>
                  Wallet credit is
                  intentionally disabled
                  today. Day 46 will
                  process verified
                  Paystack webhooks and
                  credit the wallet
                  exactly once.
                </p>
              </div>
            </>
          ) : (
            <>
              <Clock3
                size={38}
                className="text-amber-600"
              />

              <h1 className="mt-5 text-2xl font-bold">
                Payment not confirmed
              </h1>

              <p className="mt-3 text-slate-600">
                Paystack has not
                confirmed this payment
                as successful.
              </p>
            </>
          )}

          <Link
            href="/fund/paystack"
            className="mt-7 inline-flex font-semibold text-emerald-700"
          >
            Back to Paystack funding
          </Link>
        </section>
      </div>
    </main>
  );
}
