"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";

type LimitResponse = {
  limits: {
    platformDailyAmount: number;
    personalDailyAmount:
      | number
      | null;
    effectiveDailyAmount: number;
  };

  usage: {
    amountUsed: number;
    amountRemaining: number;
  };
};

export default function TransferSettingsPage() {
  const [data, setData] =
    useState<LimitResponse | null>(
      null
    );

  const [limit, setLimit] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadSettings() {
    try {
      const response =
        await fetch(
          "/api/transfer/limits"
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to load settings."
        );

        return;
      }

      setData(result);

      setLimit(
        result.limits
          .personalDailyAmount !==
        null
          ? String(
              result.limits
                .personalDailyAmount
            )
          : ""
      );
    } catch {
      setError(
        "Could not reach the server."
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/transfer/limits")
      .then(async (response) => {
        const result = await response.json();

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
              "Unable to load settings."
          );

          return;
        }

        setData(result);

        setLimit(
          result.limits
            .personalDailyAmount !== null
            ? String(
                result.limits
                  .personalDailyAmount
              )
            : ""
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not reach the server."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveLimit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const numericLimit =
      Number(limit);

    if (
      !Number.isFinite(
        numericLimit
      ) ||
      numericLimit < 1
    ) {
      setError(
        "Enter a valid daily transfer limit."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/transfer/limits",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              dailyLimit:
                numericLimit,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to update limit."
        );

        return;
      }

      setMessage(
        result.message
      );

      await loadSettings();
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeLimit() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/transfer/limits",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              dailyLimit: null,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to reset limit."
        );

        return;
      }

      setLimit("");
      setMessage(
        result.message
      );

      await loadSettings();
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
        <Link
          href="/transfer"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft size={18} />
          Back to transfer
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck
                size={24}
              />
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              Transfer limits
            </h1>

            <p className="mt-2 text-slate-600">
              Set a personal daily
              spending limit for wallet
              transfers.
            </p>
          </div>

          {data && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Effective limit
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatCurrency(
                    data.limits
                      .effectiveDailyAmount
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Used today
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatCurrency(
                    data.usage
                      .amountUsed
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Remaining today
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatCurrency(
                    data.usage
                      .amountRemaining
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Platform maximum
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatCurrency(
                    data.limits
                      .platformDailyAmount
                  )}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={saveLimit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="dailyLimit"
                className="mb-2 block text-sm font-medium"
              >
                Personal daily limit
              </label>

              <input
                id="dailyLimit"
                type="number"
                min="1"
                step="1"
                value={limit}
                onChange={(event) => {
                  setLimit(
                    event.target.value
                  );

                  setError("");
                  setMessage("");
                }}
                placeholder="Example: 300000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

              <p className="mt-2 text-sm text-slate-500">
                Your limit cannot exceed
                the platform maximum.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  !limit
                }
                className="rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
              >
                {loading
                  ? "Saving..."
                  : "Save Limit"}
              </button>

              <button
                type="button"
                onClick={removeLimit}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-5 py-3.5 font-semibold text-slate-700 disabled:opacity-50"
              >
                Use Platform Limit
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
