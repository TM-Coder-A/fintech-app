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
  Wallet,
} from "lucide-react";

import { registerSchema } from "@/lib/validation/register";

type RegisterField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "terms";

type FormErrors = Partial<Record<RegisterField, string>>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  function clearFieldError(field: RegisterField) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];

      return nextErrors;
    });
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrors({});
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);

    const values = {
      firstName: String(
        formData.get("firstName") ?? ""
      ),
      lastName: String(
        formData.get("lastName") ?? ""
      ),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(
        formData.get("password") ?? ""
      ),
      confirmPassword: String(
        formData.get("confirmPassword") ?? ""
      ),
      terms: formData.get("terms") === "on",
    };

    const result = registerSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: FormErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (
          typeof field === "string" &&
          [
            "firstName",
            "lastName",
            "email",
            "phone",
            "password",
            "confirmPassword",
            "terms",
          ].includes(field)
        ) {
          const typedField = field as RegisterField;

          if (!nextErrors[typedField]) {
            nextErrors[typedField] = issue.message;
          }
        }
      }

      setErrors(nextErrors);
      return;
    }

    console.log(
      "Validated registration data:",
      result.data
    );

    setSuccessMessage(
      "Registration details are valid. Database connection comes later."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT PANEL */}
        <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-emerald-400"
          >
            NovaPay
          </Link>

          <div className="max-w-lg">
            <div className="mb-8 inline-flex rounded-2xl bg-emerald-500/10 p-4">
              <Wallet
                className="text-emerald-400"
                size={34}
              />
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Your money.
              <br />
              Your control.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Create your account and manage payments,
              transfers and wallet activity from one
              secure platform.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck
                  className="text-emerald-400"
                  size={20}
                />
                Secure account protection
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-300">
                <LockKeyhole
                  className="text-emerald-400"
                  size={20}
                />
                Protected account credentials
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 NovaPay. Demo fintech platform.
          </p>
        </section>

        {/* RIGHT PANEL */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-lg">
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
              Create your account
            </h2>

            <p className="mt-2 text-slate-600">
              Enter your information to get started.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="John"
                    onChange={() =>
                      clearFieldError("firstName")
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:ring-4 ${
                      errors.firstName
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                    }`}
                  />

                  {errors.firstName && (
                    <p className="mt-2 text-sm text-rose-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    onChange={() =>
                      clearFieldError("lastName")
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:ring-4 ${
                      errors.lastName
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                    }`}
                  />

                  {errors.lastName && (
                    <p className="mt-2 text-sm text-rose-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

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
                  onChange={() =>
                    clearFieldError("email")
                  }
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
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+44 7000 000000"
                  onChange={() =>
                    clearFieldError("phone")
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:ring-4 ${
                    errors.phone
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }`}
                />

                {errors.phone && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.phone}
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
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    onChange={() =>
                      clearFieldError("password")
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 outline-none transition focus:ring-4 ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
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

                {errors.password ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    At least 8 characters including
                    uppercase, lowercase and a number.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    onChange={() =>
                      clearFieldError(
                        "confirmPassword"
                      )
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 outline-none transition focus:ring-4 ${
                      errors.confirmPassword
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3">
                  <input
                    name="terms"
                    type="checkbox"
                    onChange={() =>
                      clearFieldError("terms")
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-emerald-600"
                  />

                  <span className="text-sm leading-6 text-slate-600">
                    I agree to the{" "}
                    <span className="font-medium text-emerald-600">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-emerald-600">
                      Privacy Policy
                    </span>
                    .
                  </span>
                </label>

                {errors.terms && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.terms}
                  </p>
                )}
              </div>

              {successMessage && (
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2
                    size={20}
                    className="shrink-0"
                  />

                  <p>{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
              >
                Create Account
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
