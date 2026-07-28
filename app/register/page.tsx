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
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrors({});
    setMessage("");
    setServerError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const values = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(
        formData.get("confirmPassword") ?? ""
      ),
      terms: formData.get("terms") === "on",
    };

    const clientResult = registerSchema.safeParse(values);

    if (!clientResult.success) {
      const nextErrors: FormErrors = {};

      for (const issue of clientResult.error.issues) {
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

    try {
      setLoading(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(
          data.message ?? "Registration request failed."
        );
        return;
      }

      setMessage(data.message);
      form.reset();
    } catch {
      setServerError(
        "Could not reach the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
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

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-lg">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <h2 className="text-3xl font-bold text-slate-950">
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
                    onChange={() =>
                      clearFieldError("firstName")
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
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
                    onChange={() =>
                      clearFieldError("lastName")
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
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
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  onChange={() =>
                    clearFieldError("email")
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
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
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  onChange={() =>
                    clearFieldError("phone")
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
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
                    type={showPassword ? "text" : "password"}
                    onChange={() =>
                      clearFieldError("password")
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
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
                    onChange={() =>
                      clearFieldError("confirmPassword")
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
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

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="terms"
                  onChange={() =>
                    clearFieldError("terms")
                  }
                  className="mt-1 accent-emerald-600"
                />

                <span className="text-sm text-slate-600">
                  I agree to the Terms of Service and
                  Privacy Policy.
                </span>
              </label>

              {errors.terms && (
                <p className="text-sm text-rose-600">
                  {errors.terms}
                </p>
              )}

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
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white disabled:bg-slate-300"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600"
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
