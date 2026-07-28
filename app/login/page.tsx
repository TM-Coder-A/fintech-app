"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import { loginSchema } from "@/lib/validation/login";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setServerError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email") {
          setEmailError(issue.message);
        }

        if (issue.path[0] === "password") {
          setPasswordError(issue.message);
        }
      }

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(
          data.message ?? "Login request failed."
        );
        return;
      }

      setMessage(data.message);
    } catch {
      setServerError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        <Link
          href="/"
          className="text-2xl font-bold text-emerald-600"
        >
          NovaPay
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Sign in
        </h1>

        <p className="mt-2 text-slate-600">
          Access your account.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              name="email"
              type="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            {emailError && (
              <p className="mt-2 text-sm text-rose-600">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="mt-2 text-sm text-rose-600">
                {passwordError}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {serverError}
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
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-600"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
