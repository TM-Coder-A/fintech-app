import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";

import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function TransactionsPage() {
  const user = await getCurrentUser();

  if (!user.wallet) {
    return null;
  }

  const wallet = user.wallet;

  const transactions =
    await prisma.transaction.findMany({
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
    });

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          title="Transaction history"
          description="Your real wallet activity."
        />

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium">
                No transactions yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your wallet activity will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const isFunding =
                  transaction.type === "FUNDING";

                const incoming =
                  transaction.receiverWalletId ===
                  wallet.id;

                const counterparty =
                  incoming
                    ? transaction.senderWallet?.user
                    : transaction.receiverWallet?.user;

                let title = "";
                let subtitle = "";

                if (isFunding) {
                  title = "Wallet funded";
                  subtitle =
                    transaction.narration ??
                    "Wallet funding";
                } else if (incoming) {
                  title = "Money received";

                  subtitle = counterparty
                    ? `From ${counterparty.firstName} ${counterparty.lastName}`
                    : "Wallet transfer";
                } else {
                  title = "Money sent";

                  subtitle = counterparty
                    ? `To ${counterparty.firstName} ${counterparty.lastName}`
                    : "Wallet transfer";
                }

                return (
                  <Link
                    key={transaction.id}
                    href={`/transactions/${transaction.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          isFunding || incoming
                            ? "rounded-xl bg-emerald-50 p-3 text-emerald-600"
                            : "rounded-xl bg-rose-50 p-3 text-rose-600"
                        }
                      >
                        {isFunding ? (
                          <Plus size={20} />
                        ) : incoming ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {subtitle}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {transaction.reference}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={
                          isFunding || incoming
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-slate-950"
                        }
                      >
                        {isFunding || incoming ? "+" : "-"}
                        {formatCurrency(
                          Number(transaction.amount)
                        )}
                      </p>

                      <div className="mt-2">
                        <StatusBadge
                          status={
                            transaction.status ===
                            "SUCCESSFUL"
                              ? "Successful"
                              : transaction.status ===
                                "FAILED"
                              ? "Failed"
                              : "Pending"
                          }
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        {transaction.createdAt.toLocaleString(
                          "en-NG"
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
