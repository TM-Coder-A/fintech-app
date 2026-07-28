"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  User,
  Wallet,
} from "lucide-react";

export default function TransferPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  const recipient = useMemo(() => {
    if (accountNumber.length >= 10) {
      return {
        name: "Sarah Michael",
        bank: "NovaPay Wallet",
      };
    }

    return null;
  }, [accountNumber]);

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

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Send size={24} />
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              Send money
            </h1>

            <p className="mt-2 text-slate-600">
              Transfer money securely to another NovaPay user.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <div>
              <label
                htmlFor="accountNumber"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Recipient account number
              </label>

              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="Enter 10-digit account number"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <p className="mt-2 text-xs text-slate-500">
                Demo lookup activates after 10 digits.
              </p>
            </div>

            {recipient && (
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600">
                  <User size={20} />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-950">
                    {recipient.name}
                  </p>

                  <p className="text-sm text-slate-600">
                    {recipient.bank}
                  </p>
                </div>

                <CheckCircle2 className="text-emerald-600" size={22} />
              </div>
            )}

            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                  £
                </span>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="narration"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Narration
              </label>

              <input
                id="narration"
                name="narration"
                type="text"
                maxLength={80}
                value={narration}
                onChange={(event) => setNarration(event.target.value)}
                placeholder="What is this transfer for?"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {narration.length}/80
              </p>
            </div>

            <button
              type="submit"
              disabled={!recipient || !amount || Number(amount) <= 0}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Review Transfer
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Wallet size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Available balance
                </p>

                <p className="text-xl font-bold">
                  £12,480.50
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Transfer summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Recipient
                </span>

                <span className="text-right font-medium text-slate-900">
                  {recipient ? recipient.name : "Not selected"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Account
                </span>

                <span className="font-medium text-slate-900">
                  {accountNumber || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Amount
                </span>

                <span className="font-semibold text-slate-950">
                  {amount
                    ? `£${Number(amount).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "£0.00"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">
                  Narration
                </span>

                <span className="max-w-[180px] text-right font-medium text-slate-900">
                  {narration || "—"}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
