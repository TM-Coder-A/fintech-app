"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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
              Secure access to your NovaPay account
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
              onSubmit={(event) => event.preventDefault()}
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
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
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
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-slate-950"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
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

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
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
