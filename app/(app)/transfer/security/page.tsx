"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

export default function TransferSecurityPage() {
  const [transfersEnabled, setTransfersEnabled] =
    useState<boolean | null>(null);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/transfer/security")
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
              "Unable to load transfer security."
          );

          return;
        }

        setTransfersEnabled(
          result.transfersEnabled
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

  async function updateSecurity(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (transfersEnabled === null) {
      return;
    }

    if (!password) {
      setError(
        "Enter your current password."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const requestedState =
        !transfersEnabled;

      const response = await fetch(
        "/api/transfer/security",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            transfersEnabled:
              requestedState,
            password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to update transfer security."
        );

        return;
      }

      setTransfersEnabled(
        result.transfersEnabled
      );

      setPassword("");
      setMessage(result.message);
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
            <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
              <LockKeyhole size={24} />
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              Transfer security
            </h1>

            <p className="mt-2 text-slate-600">
              Temporarily block or restore
              outgoing transfers from your
              wallet.
            </p>
          </div>

          {transfersEnabled !== null && (
            <div
              className={`mb-8 rounded-2xl p-5 ${
                transfersEnabled
                  ? "bg-emerald-50"
                  : "bg-rose-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {transfersEnabled ? (
                  <ShieldCheck
                    className="mt-0.5 text-emerald-600"
                    size={22}
                  />
                ) : (
                  <ShieldOff
                    className="mt-0.5 text-rose-600"
                    size={22}
                  />
                )}

                <div>
                  <p className="font-bold text-slate-950">
                    {transfersEnabled
                      ? "Outgoing transfers enabled"
                      : "Outgoing transfers disabled"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {transfersEnabled
                      ? "Your wallet can currently send money."
                      : "Your wallet can receive money, but outgoing transfers are blocked."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={updateSecurity}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Current password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

              <p className="mt-2 text-sm text-slate-500">
                Your password is required
                before changing this
                security setting.
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

            <button
              type="submit"
              disabled={
                loading ||
                transfersEnabled === null ||
                !password
              }
              className={`w-full rounded-xl px-5 py-3.5 font-semibold text-white disabled:bg-slate-300 ${
                transfersEnabled
                  ? "bg-rose-600"
                  : "bg-slate-950"
              }`}
            >
              {loading
                ? "Updating..."
                : transfersEnabled
                  ? "Disable Outgoing Transfers"
                  : "Enable Outgoing Transfers"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
