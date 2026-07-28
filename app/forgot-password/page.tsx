"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import {
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/password/forgot",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to process request."
        );

        return;
      }

      setMessage(
        result.message
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
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft size={18} />
          Back to login
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <Mail size={24} />
          </div>

          <h1 className="text-3xl font-bold text-slate-950">
            Forgot password?
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Enter the email address
            associated with your account.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );
                  setError("");
                  setMessage("");
                }}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
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
                loading || !email
              }
              className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
            >
              {loading
                ? "Processing..."
                : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
