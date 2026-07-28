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

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const wallet = user.wallet;

  const balance = wallet
    ? Number(wallet.balance)
    : 0;

  const recentTransactions = wallet
    ? await prisma.transaction.findMany({
        where: {
          OR: [
            {
              senderWalletId: wallet.id,
            },
            {
              receiverWalletId: wallet.id,
            },
          ],
        },
        include: {
          senderWallet: {
            include: {
              user: true,
            },
          },
          receiverWallet: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      })
    : [];

  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm text-slate-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {user.firstName} {user.lastName}
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
                  {formatCurrency(balance)}
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
                {wallet?.accountNumber ?? "Not available"}
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
              Account overview
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm text-slate-500">
                  Account holder
                </p>

                <p className="mt-1 font-semibold text-slate-950">
                  {user.firstName} {user.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Email
                </p>

                <p className="mt-1 break-all font-semibold text-slate-950">
                  {user.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <CreditCard size={20} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Currency
                  </p>

                  <p className="font-semibold text-slate-950">
                    {wallet?.currency ?? "NGN"}
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
                Your latest wallet activity
              </p>
            </div>

            <Link
              href="/transactions"
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-slate-900">
                No transactions yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your completed transfers will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((transaction) => {
                const incoming =
                  transaction.receiverWalletId === wallet?.id;

                const counterparty =
                  incoming
                    ? transaction.senderWallet?.user
                    : transaction.receiverWallet?.user;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 px-6 py-5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          incoming
                            ? "rounded-xl bg-emerald-50 p-3 text-emerald-600"
                            : "rounded-xl bg-rose-50 p-3 text-rose-600"
                        }
                      >
                        {incoming ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-950">
                          {incoming
                            ? "Money received"
                            : "Money sent"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {counterparty
                            ? `${incoming ? "From" : "To"} ${counterparty.firstName} ${counterparty.lastName}`
                            : "Wallet transfer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {transaction.reference}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={
                          incoming
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-slate-950"
                        }
                      >
                        {incoming ? "+" : "-"}
                        {formatCurrency(
                          Number(transaction.amount)
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.createdAt.toLocaleString(
                          "en-NG"
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
