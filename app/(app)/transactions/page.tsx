"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Search,
} from "lucide-react";

const transactions = [
  {
    id: 1,
    title: "Payment received",
    subtitle: "From Daniel James",
    reference: "NP-482931",
    date: "28 Jul 2026",
    amount: 450,
    type: "credit",
    status: "Successful",
  },
  {
    id: 2,
    title: "Transfer sent",
    subtitle: "To Sarah Michael",
    reference: "NP-482105",
    date: "27 Jul 2026",
    amount: 120,
    type: "debit",
    status: "Successful",
  },
  {
    id: 3,
    title: "Wallet funding",
    subtitle: "Bank card",
    reference: "NP-481932",
    date: "26 Jul 2026",
    amount: 1000,
    type: "credit",
    status: "Successful",
  },
  {
    id: 4,
    title: "Transfer sent",
    subtitle: "To Michael Brown",
    reference: "NP-481644",
    date: "25 Jul 2026",
    amount: 75.5,
    type: "debit",
    status: "Pending",
  },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.title.toLowerCase().includes(search.toLowerCase()) ||
        transaction.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" || transaction.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

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
            Transaction history
          </h1>

          <p className="mt-2 text-slate-600">
            Review your recent NovaPay account activity.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "credit", label: "Money in" },
                  { value: "debit", label: "Money out" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={
                      filter === option.value
                        ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={
                        transaction.type === "credit"
                          ? "rounded-xl bg-emerald-50 p-3 text-emerald-600"
                          : "rounded-xl bg-rose-50 p-3 text-rose-600"
                      }
                    >
                      {transaction.type === "credit" ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">
                        {transaction.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.subtitle}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>{transaction.date}</span>
                        <span>{transaction.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:block sm:text-right">
                    <p
                      className={
                        transaction.type === "credit"
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-slate-950"
                      }
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      £
                      {transaction.amount.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>

                    <span
                      className={
                        transaction.status === "Successful"
                          ? "mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                          : "mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                      }
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="font-medium text-slate-900">
                  No transactions found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
