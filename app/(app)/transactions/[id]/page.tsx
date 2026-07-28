import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ReceiptText,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";
import PrintReceiptButton from "@/components/transactions/PrintReceiptButton";

type TransactionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user.wallet) {
    notFound();
  }

  const transaction =
    await prisma.transaction.findUnique({
      where: {
        id,
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
    });

  if (!transaction) {
    notFound();
  }

  const belongsToUser =
    transaction.senderWalletId ===
      user.wallet.id ||
    transaction.receiverWalletId ===
      user.wallet.id;

  if (!belongsToUser) {
    notFound();
  }

  const isFunding =
    transaction.type === "FUNDING";

  const incoming =
    transaction.receiverWalletId ===
    user.wallet.id;

  const statusLabel =
    transaction.status === "SUCCESSFUL"
      ? "Successful"
      : transaction.status === "FAILED"
        ? "Failed"
        : transaction.status === "REVERSED"
          ? "Reversed"
          : "Pending";

  const senderName =
    transaction.senderWallet?.user
      ? `${transaction.senderWallet.user.firstName} ${transaction.senderWallet.user.lastName}`
      : isFunding
        ? "External funding"
        : "Not available";

  const receiverName =
    transaction.receiverWallet?.user
      ? `${transaction.receiverWallet.user.firstName} ${transaction.receiverWallet.user.lastName}`
      : "Not available";

  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/transactions"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={18} />
          Back to transactions
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              {transaction.status ===
              "SUCCESSFUL" ? (
                <CheckCircle2 size={28} />
              ) : (
                <Clock3 size={28} />
              )}
            </div>

            <p className="mt-5 text-sm text-slate-500">
              {isFunding
                ? "Wallet funding"
                : incoming
                  ? "Money received"
                  : "Money sent"}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-950">
              {incoming || isFunding
                ? "+"
                : "-"}
              {formatCurrency(
                Number(transaction.amount)
              )}
            </h1>

            <div className="mt-3">
              <span
                className={
                  statusLabel ===
                  "Successful"
                    ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
                    : statusLabel ===
                        "Failed"
                      ? "inline-flex rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700"
                      : "inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700"
                }
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <div className="space-y-5">
              <DetailRow
                label="Reference"
                value={transaction.reference}
              />

              <DetailRow
                label="Transaction type"
                value={transaction.type}
              />

              <DetailRow
                label="Date"
                value={transaction.createdAt.toLocaleString(
                  "en-NG"
                )}
              />

              <DetailRow
                label="Sender"
                value={senderName}
              />

              <DetailRow
                label="Sender account"
                value={
                  transaction.senderWallet
                    ?.accountNumber ??
                  "Not available"
                }
              />

              <DetailRow
                label="Receiver"
                value={receiverName}
              />

              <DetailRow
                label="Receiver account"
                value={
                  transaction.receiverWallet
                    ?.accountNumber ??
                  "Not available"
                }
              />

              <DetailRow
                label="Narration"
                value={
                  transaction.narration ||
                  "No narration"
                }
              />
            </div>
          </div>

          <PrintReceiptButton />

          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
            <div className="flex gap-3">
              <ReceiptText
                size={20}
                className="mt-0.5 text-slate-600"
              />

              <div>
                <p className="font-semibold text-slate-950">
                  Transaction receipt
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Keep the transaction
                  reference for support and
                  reconciliation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-6">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="break-all text-sm font-semibold text-slate-950 sm:text-right">
        {value}
      </span>
    </div>
  );
}
