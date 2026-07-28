"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { loginSchema } from "@/lib/validation/login";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [emailError, setEmailError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [serverError, setServerError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setServerError("");

    const formData =
      new FormData(event.currentTarget);

    const values = {
      email: String(
        formData.get("email") ?? ""
      ),
      password: String(
        formData.get("password") ?? ""
      ),
    };

    const result =
      loginSchema.safeParse(values);

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

      const response = await fetch(
        "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            result.data
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServerError(
          data.message ??
            "Login failed."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
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
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={24} />
          </div>

          <Link
            href="/"
            className="text-2xl font-bold text-emerald-600"
          >
            NovaPay
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold text-slate-950">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-600">
          Sign in to access your account.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            {emailError && (
              <p className="mt-2 text-sm text-rose-600">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
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
