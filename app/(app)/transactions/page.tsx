"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";

type TransactionStatus =
  | "Successful"
  | "Pending"
  | "Failed";

type TransactionType =
  | "credit"
  | "debit";

interface Transaction {
  id: number;
  title: string;
  subtitle: string;
  reference: string;
  date: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

const transactions: Transaction[] = [
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
  {
    id: 5,
    title: "Transfer failed",
    subtitle: "To Emily Carter",
    reference: "NP-481402",
    date: "24 Jul 2026",
    amount: 200,
    type: "debit",
    status: "Failed",
  },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | TransactionType
  >("all");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.title
          .toLowerCase()
          .includes(query) ||
        transaction.subtitle
          .toLowerCase()
          .includes(query) ||
        transaction.reference
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        transaction.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          title="Transaction history"
          description="Review your recent account activity."
        />

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={
                    filter === "all"
                      ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("credit")
                  }
                  className={
                    filter === "credit"
                      ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  }
                >
                  Money in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("debit")
                  }
                  className={
                    filter === "debit"
                      ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  }
                >
                  Money out
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          transaction.type === "credit"
                            ? "rounded-xl bg-emerald-50 p-3 text-emerald-600"
                            : "rounded-xl bg-rose-50 p-3 text-rose-600"
                        }
                      >
                        {transaction.type ===
                        "credit" ? (
                          <ArrowDownLeft
                            size={20}
                          />
                        ) : (
                          <ArrowUpRight
                            size={20}
                          />
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
                          <span>
                            {transaction.date}
                          </span>

                          <span>
                            {transaction.reference}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:block sm:text-right">
                      <p
                        className={
                          transaction.type ===
                          "credit"
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-slate-950"
                        }
                      >
                        {transaction.type ===
                        "credit"
                          ? "+"
                          : "-"}
                        {formatCurrency(
                          transaction.amount
                        )}
                      </p>

                      <div className="mt-2">
                        <StatusBadge
                          status={
                            transaction.status
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="font-medium text-slate-950">
                  No transactions found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or
                  transaction filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
