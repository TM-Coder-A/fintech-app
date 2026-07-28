"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+44 7000 000000");
  const [message, setMessage] = useState("");

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("Profile changes saved locally for this demo.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-emerald-600"
          >
            NovaPay
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Profile & settings
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your personal information and account preferences.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr]">
          {/* PROFILE SUMMARY */}
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <User size={34} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {firstName} {lastName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal account
              </p>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 text-slate-400"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Email
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-0.5 text-slate-400"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {phone}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Wallet size={22} />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    NovaPay account
                  </p>

                  <p className="font-semibold">
                    1058 4729 31
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Account type
                </p>

                <p className="mt-1 font-medium">
                  Personal Wallet
                </p>
              </div>
            </section>
          </aside>

          {/* SETTINGS */}
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-950">
                  Personal information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your profile details.
                </p>
              </div>

              <form
                onSubmit={handleSave}
                className="space-y-5"
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
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
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
                      type="text"
                      value={lastName}
                      onChange={(event) =>
                        setLastName(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
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
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
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
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {message && (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your password and account security.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="text-slate-500" size={20} />

                  <div>
                    <p className="font-medium text-slate-950">
                      Password
                    </p>

                    <p className="text-sm text-slate-500">
                      Change your account password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Change Password
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-950">
                Account session
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign out of your current NovaPay session.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700"
              >
                Sign Out
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
