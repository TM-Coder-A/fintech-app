import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  History,
  Plus,
  Send,
  Wallet,
} from "lucide-react";

const transactions = [
  {
    id: 1,
    title: "Payment received",
    subtitle: "From Daniel James",
    amount: "+£450.00",
    type: "credit",
  },
  {
    id: 2,
    title: "Transfer sent",
    subtitle: "To Sarah Michael",
    amount: "-£120.00",
    type: "debit",
  },
  {
    id: 3,
    title: "Wallet funding",
    subtitle: "Bank card",
    amount: "+£1,000.00",
    type: "credit",
  },
];

export default function DashboardPage() {
  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm text-slate-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            John Doe
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-lg lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Available balance
                </p>

                <h2 className="mt-2 text-4xl font-bold">
                  £12,480.50
                </h2>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <Wallet size={26} />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Account number
              </p>

              <p className="mt-1 font-mono text-lg tracking-wider">
                1058 4729 31
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Link
                href="/transfer"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 text-sm font-medium transition hover:bg-white/15"
              >
                <Send size={20} />
                Send
              </Link>

              <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 text-sm font-medium transition hover:bg-white/15"
              >
                <Plus size={20} />
                Add Money
              </button>

              <Link
                href="/transactions"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 text-sm font-medium transition hover:bg-white/15"
              >
                <History size={20} />
                History
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7">
            <p className="text-sm font-medium text-slate-500">
              This month
            </p>

            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <ArrowDownLeft size={20} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Money in
                  </p>

                  <p className="font-semibold text-slate-950">
                    £3,200.00
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                  <ArrowUpRight size={20} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Money out
                  </p>

                  <p className="font-semibold text-slate-950">
                    £1,465.50
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <CreditCard size={20} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Transactions
                  </p>

                  <p className="font-semibold text-slate-950">
                    18
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Recent transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest account activity
              </p>
            </div>

            <Link
              href="/transactions"
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between px-6 py-5"
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
                    <p className="font-medium text-slate-950">
                      {transaction.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.subtitle}
                    </p>
                  </div>
                </div>

                <p
                  className={
                    transaction.type === "credit"
                      ? "font-semibold text-emerald-600"
                      : "font-semibold text-slate-950"
                  }
                >
                  {transaction.amount}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
