"use client";

import Link from "next/link";
import { useState } from "react";
import {
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

    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <main>
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
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <User size={34} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                {firstName} {lastName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal account
              </p>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <div className="flex gap-3">
                  <Mail size={18} className="text-slate-400" />

                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium">{email}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone size={18} className="text-slate-400" />

                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium">{phone}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <Wallet size={22} />

                <div>
                  <p className="text-sm text-slate-400">
                    Account number
                  </p>

                  <p className="font-semibold">
                    1058 4729 31
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold">
                Personal information
              </h2>

              <form
                onSubmit={handleSave}
                className="mt-6 space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />

                {message && (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
                >
                  Save Changes
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex gap-4">
                <ShieldCheck className="text-emerald-600" />

                <div>
                  <h2 className="text-xl font-semibold">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your password and account security.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole size={20} />

                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-slate-500">
                      Change your account password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Change Password
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Account session
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign out of your current session.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white"
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
