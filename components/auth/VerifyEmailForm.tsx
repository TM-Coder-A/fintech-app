"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import {
  BadgeCheck,
  MailCheck,
} from "lucide-react";

type Props = {
  token: string;
};

export default function VerifyEmailForm({
  token,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [verified, setVerified] =
    useState(false);

  async function verifyEmail(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/email-verification/verify",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to verify email."
        );

        return;
      }

      setVerified(true);
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <BadgeCheck size={26} />
        </div>

        <h1 className="text-3xl font-bold text-slate-950">
          Email verified
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Your email address has been
          verified successfully.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white"
        >
          Continue
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
        <MailCheck size={26} />
      </div>

      <h1 className="text-3xl font-bold text-slate-950">
        Verify your email
      </h1>

      <p className="mt-3 text-sm text-slate-600">
        Confirm ownership of your email
        address to enable outgoing
        transfers.
      </p>

      {error && (
        <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={verifyEmail}
        className="mt-7"
      >
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
        >
          {loading
            ? "Verifying..."
            : "Verify Email"}
        </button>
      </form>
    </section>
  );
}
