import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      wallet: true,
    },
  });

  if (!user?.wallet) {
    redirect("/login");
  }

  const transactions =
    await prisma.transaction.findMany({
      where: {
        OR: [
          {
            senderWalletId: user.wallet.id,
          },
          {
            receiverWalletId: user.wallet.id,
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
                Your completed transfers will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const incoming =
                  transaction.receiverWalletId ===
                  user.wallet!.id;

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
                        <p className="font-semibold">
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

                      <div className="mt-2">
                        <StatusBadge
                          status={
                            transaction.status === "SUCCESSFUL"
                              ? "Successful"
                              : transaction.status === "FAILED"
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
