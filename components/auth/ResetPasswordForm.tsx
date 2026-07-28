"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  KeyRound,
} from "lucide-react";

type Props = {
  token: string;
};

export default function ResetPasswordForm({
  token,
}: Props) {
  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/password/reset",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
              password,
              confirmPassword,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to reset password."
        );

        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <KeyRound size={24} />
        </div>

        <h1 className="text-3xl font-bold text-slate-950">
          Password changed
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Your password has been reset
          successfully. All previous
          sessions have been signed out.
        </p>

        <Link
          href="/login"
          className="mt-7 inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
        <KeyRound size={24} />
      </div>

      <h1 className="text-3xl font-bold text-slate-950">
        Create new password
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Enter a new secure password for
        your account.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-5"
      >
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium"
          >
            New password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium"
          >
            Confirm new password
          </label>

          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={
              confirmPassword
            }
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            required
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
            !password ||
            !confirmPassword
          }
          className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
        >
          {loading
            ? "Resetting..."
            : "Reset Password"}
        </button>
      </form>
    </section>
  );
}
