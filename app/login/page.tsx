"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { loginSchema } from "@/lib/validation/login";

type LoginField = "email" | "password";

type LoginErrors = Partial<Record<LoginField, string>>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  function clearFieldError(field: LoginField) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];

      return nextErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);

    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: LoginErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (
          typeof field === "string" &&
          ["email", "password"].includes(field)
        ) {
          const typedField = field as LoginField;

          if (!nextErrors[typedField]) {
            nextErrors[typedField] = issue.message;
          }
        }
      }

      setErrors(nextErrors);
      return;
    }

    console.log("Validated login data:", result.data);

    setSuccessMessage(
      "Login details are valid. Authentication will be connected later."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-emerald-400"
          >
            NovaPay
          </Link>

          <div className="max-w-lg">
            <div className="mb-8 inline-flex rounded-2xl bg-emerald-500/10 p-4">
              <ShieldCheck
                className="text-emerald-400"
                size={34}
              />
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Welcome back.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Sign in to manage your wallet, transfers and transaction history.
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-slate-300">
              <LockKeyhole
                className="text-emerald-400"
                size={20}
              />
              Secure access to your account
            </div>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 NovaPay. Demo fintech platform.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="text-2xl font-bold text-emerald-600"
              >
                NovaPay
              </Link>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Sign in
            </h2>

            <p className="mt-2 text-slate-600">
              Enter your details to access your account.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  onChange={() => clearFieldError("email")}
                  className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:ring-4 ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }`}
                />

                {errors.email && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    href="#"
                    className="text-sm font-medium text-emerald-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onChange={() => clearFieldError("password")}
                    className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 outline-none transition focus:ring-4 ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
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

                {errors.password && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 cursor-pointer accent-emerald-600"
                />

                <span className="text-sm text-slate-600">
                  Remember me
                </span>
              </label>

              {successMessage && (
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <p>{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
              >
                Sign In
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-600 hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
